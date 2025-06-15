import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import xgboost as xgb
import json
import sys
import warnings
from datetime import datetime
warnings.filterwarnings('ignore')

# Custom JSON encoder to handle NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

# Load and preprocess data once (global scope)
try:
    train_df = pd.read_csv('train_data.csv')
    city_income_df = pd.read_csv('world_population_with_city_income.csv')
    train_df = train_df.merge(city_income_df[['city', 'population', 'per_capita_income_usd']], on='city', how='left')
except FileNotFoundError as e:
    print(json.dumps({"error": f"Error: {str(e)}. Please ensure train_data.csv and world_population_with_city_income.csv are in the correct directory."}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Error loading data: {str(e)}"}))
    sys.exit(1)

# Preprocess data to retain all records
train_df = train_df.drop_duplicates(keep='first').reset_index(drop=True)
train_df['city'] = train_df['city'].fillna('Unknown')

train_df['phq_attendance'] = train_df['phq_attendance'].fillna(0)
train_df['predicted_event_spend'] = train_df['predicted_event_spend'].fillna(0)
train_df['rank'] = train_df['rank'].fillna(0)
train_df['local_rank'] = train_df['local_rank'].fillna(0)
train_df['population'] = train_df['population'].fillna(0)
train_df['per_capita_income_usd'] = train_df['per_capita_income_usd'].fillna(0)
train_df['category'] = train_df['category'].fillna('General')
train_df['title'] = train_df['title'].fillna('Unknown Event')
train_df['combined_features'] = train_df['title'].fillna('') + ' ' + train_df['category'].fillna('') + ' ' + train_df['city'].fillna('')

# Normalize columns
def normalize_column(col):
    return (col - col.min()) / (col.max() - col.min() + 1e-10)

train_df['norm_attendance'] = normalize_column(train_df['phq_attendance'])
train_df['norm_spend'] = normalize_column(train_df['predicted_event_spend'])
train_df['norm_rank'] = normalize_column(train_df['rank'])
train_df['norm_local_rank'] = normalize_column(train_df['local_rank'])

# Train model once
features = ['phq_attendance', 'predicted_event_spend', 'population', 'per_capita_income_usd']
X_train = train_df[features].fillna(0)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

def generate_base_prices(df):
    prices = []
    for idx, row in df.iterrows():
        category = row['category'].lower() if pd.notna(row['category']) else 'other'
        if category == 'sports':
            base_price = np.random.uniform(200, 400)
        elif category == 'festival':
            base_price = np.random.uniform(10, 100)
        elif category == 'concert':
            base_price = np.random.uniform(70, 300)
        elif category == 'expo':
            base_price = np.random.uniform(10, 90)
        else:
            base_price = min(500, row['predicted_event_spend'] / 1e6) if pd.notna(row['predicted_event_spend']) else 0
        prices.append(base_price)
    return prices

y_train = pd.Series(generate_base_prices(train_df))
model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=200, learning_rate=0.03,
                         max_depth=4, reg_alpha=0.5, reg_lambda=1.0, random_state=42)
model.fit(X_train_scaled, y_train)

# Dynamic pricing function
def get_dynamic_price(event_id):
    if event_id not in train_df['event_id'].values:
        return None
    event_row = train_df[train_df['event_id'] == event_id].iloc[0]
    X_pred = np.array([[event_row[feat] for feat in features]])
    X_pred_scaled = scaler.transform(X_pred)
    base_price = model.predict(X_pred_scaled)[0]
    category_multipliers = {'sports': 1.0, 'festival': 0.2, 'concert': 1.0, 'expo': 0.3}
    category = event_row['category'].lower() if pd.notna(event_row['category']) else 'other'
    multiplier = category_multipliers.get(category, 1.0)
    attendance_factor = min(0.3, event_row['phq_attendance'] / train_df['phq_attendance'].max()) if pd.notna(event_row['phq_attendance']) else 0
    price_adjustment = 1.0 + attendance_factor  # Simpler adjustment based on attendance
    return min(600, round(base_price * max(0.9, min(1.1, price_adjustment)) * multiplier, 2))

# Global category history
user_category_history = {}

def update_category_history(event_id):
    category = train_df.loc[train_df['event_id'] == event_id, 'category'].iloc[0]
    if category not in user_category_history:
        user_category_history[category] = 1.0
    else:
        user_category_history[category] = 0.8 * user_category_history.get(category, 0) + 0.2
    total_weight = sum(user_category_history.values())
    for cat in user_category_history:
        user_category_history[cat] = user_category_history[cat] / total_weight if total_weight > 0 else 1.0 / len(user_category_history)

def get_recommendations(query, top_n=5, weights=None):
    if weights is None:
        weights = {'norm_attendance': 0.3, 'norm_spend': 0.2, 'norm_rank': 0.2, 'norm_local_rank': 0.3}

    # Check if query is an event_id or keyword
    input_event_details = None
    if query in train_df['event_id'].values:
        event_row = train_df[train_df['event_id'] == query].iloc[0]
        user_city = event_row['city']
        update_category_history(query)
        input_event_details = {
            'event_id': event_row['event_id'],
            'title': event_row['title'],
            'city': user_city,
            'phq_attendance': float(event_row['phq_attendance']),
            'predicted_event_spend': float(event_row['predicted_event_spend']),
            'category': event_row['category'] if pd.notna(event_row['category']) else 'General'
        }
    else:
        # Keyword search
        keyword_mask = (train_df['title'].str.lower().str.contains(query.lower(), na=False) | 
                        train_df['category'].str.lower().str.contains(query.lower(), na=False))
        if not keyword_mask.any():
            return None, None
        matched_events = train_df[keyword_mask]
        if matched_events.empty:
            return None, None
        event_row = matched_events.iloc[0]
        user_city = event_row['city']
        update_category_history(event_row['event_id'])
        input_event_details = {
            'event_id': event_row['event_id'],
            'title': event_row['title'],
            'city': user_city,
            'phq_attendance': float(event_row['phq_attendance']),
            'predicted_event_spend': float(event_row['predicted_event_spend']),
            'category': event_row['category'] if pd.notna(event_row['category']) else 'General'
        }

    if input_event_details is None:
        return None, None

    train_df['collaborative_score'] = (weights['norm_attendance'] * train_df['norm_attendance'] +
                                      weights['norm_spend'] * train_df['norm_spend'] +
                                      weights['norm_rank'] * train_df['norm_rank'] +
                                      weights['norm_local_rank'] * train_df['norm_local_rank'])

    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = tfidf.fit_transform(train_df['combined_features'])
    content_similarity = cosine_similarity(tfidf_matrix, tfidf_matrix)
    idx = train_df[train_df['event_id'] == input_event_details['event_id']].index[0]
    content_scores = content_similarity[idx]

    location_boost = train_df['city'] == user_city
    location_weights = np.where(location_boost, 1.5, 1.0)

    # Apply category-based boosting with diversity consideration
    category_boost = np.zeros(len(train_df))
    current_category = input_event_details['category']
    for cat, weight in user_category_history.items():
        category_mask = train_df['category'] == cat
        category_boost += np.where(category_mask, weight * 1.5, 0)  # Adjusted boost factor

    # Hybrid scoring with diversity penalty
    hybrid_scores = (content_scores * 0.4 + train_df['collaborative_score'] * 0.4) * location_weights * (1 + category_boost)
    hybrid_scores[idx] = -np.inf  # Exclude the input event

    # Strictly enforce category matching and avoid duplicates
    category_mask = train_df['category'] == current_category
    hybrid_scores[~category_mask] = -np.inf  # Penalize non-matching categories

    # Apply diversity penalty based on title similarity (fixed shape issue)
    title_tfidf = tfidf.transform(train_df['title'])
    input_title_tfidf = tfidf.transform([input_event_details['title']])
    title_similarity = cosine_similarity(title_tfidf, input_title_tfidf).flatten()  # Ensure 1D output
    diversity_penalty = np.where(title_similarity > 0.8, -1.0, 0.0)  # Penalize high title similarity
    hybrid_scores += diversity_penalty

    recommended_indices = hybrid_scores.argsort()[::-1][:top_n * 3]  # Get more candidates for diversity
    recommendations = []
    used_events = {input_event_details['event_id']}  # Exclude input event

    for i in recommended_indices:
        if len(recommendations) >= top_n:
            break
        if train_df.iloc[i]['event_id'] not in used_events and category_mask[i]:
            recommendations.append(i)
            used_events.add(train_df.iloc[i]['event_id'])

    if len(recommendations) < top_n:
        remaining_indices = [i for i in recommended_indices if i not in recommendations and category_mask[i]]
        recommendations.extend(remaining_indices[:top_n - len(recommendations)])

    recommendations = train_df.iloc[recommendations][['event_id', 'title', 'city', 'category', 'phq_attendance', 'predicted_event_spend']].to_dict('records')

    # Add dynamic prices
    input_event_details['dynamic_price'] = get_dynamic_price(input_event_details['event_id'])
    for rec in recommendations:
        rec['dynamic_price'] = get_dynamic_price(rec['event_id'])

    return input_event_details, recommendations

# Main execution for PythonShell
if __name__ == "__main__":
    try:
        query = sys.argv[1] if len(sys.argv) > 1 else None
        if not query:
            print(json.dumps({"error": "No event ID or query provided"}))
            sys.exit(1)
        
        input_event_details, recommendations = get_recommendations(query)
        if input_event_details is None or recommendations is None or len(recommendations) < 1:
            print(json.dumps({"error": f"Event ID or query '{query}' not found or insufficient events in the same category"}))
            sys.exit(1)
        
        # Output JSON result with current timestamp and category history
        current_time = datetime.now().strftime("%I:%M %p , Thursday, June 12, 2025")
        result = {
            "timestamp": current_time,
            "input_event": input_event_details,
            "recommendations": recommendations,
            "metadata": {
                "total_events": len(train_df),
                "unique_cities": train_df['city'].nunique(),
                "query_type": "event_id" if query in train_df['event_id'].values else "keyword_search",
                "category_history": user_category_history
            }
        }
        print(json.dumps(result, cls=NumpyEncoder))
    except Exception as e:
        current_time = datetime.now().strftime("%I:%M %p , Thursday, June 12, 2025")
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}", "timestamp": current_time}))
        sys.exit(1)