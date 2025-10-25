import os
import json
from datetime import datetime
import requests

# --- CONFIG ---
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAACQb5AEAAAAAzTB1rfcoTjwhLSnjqVBP0GVjbhc%3Dib3HNGAY3NTykIEvjrNtOTrBhKhLAlfUAwtiIrsW7zBCnmjJNM" # Set your X API token in environment variables
SEARCH_QUERY = "Will bitcoin reach 80000 OR bitcoin price prediction OR btc forecast"
TWEET_COUNT = 10

# --- FUNCTION TO CALL X API ---
def fetch_tweets(query, max_results=10):
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "User-Agent": "v2RecentSearchPython"
    }
    params = {
        "query": query,
        "tweet.fields": "author_id,created_at,public_metrics",
        "max_results": max_results
    }

    response = requests.get(url, headers=headers, params=params, verify=False)
    if response.status_code != 200:
        raise Exception(f"Request returned {response.status_code}: {response.text}")
    
    return response.json()

# --- FUNCTION TO BEAUTIFY AND PRINT ---
def print_beautified_tweets(response):
    print("\n💹 BITCOIN LIVE NEWS FEED (via X API)\n" + "="*60)
    for i, tweet in enumerate(response.get("data", []), start=1):
        text = tweet["text"].replace("\n", " ").strip()
        metrics = tweet["public_metrics"]
        time = datetime.fromisoformat(tweet["created_at"].replace("Z", "+00:00")).strftime("%d %b %Y, %I:%M %p")

        print(f"\n🔹 Tweet #{i}")
        print(f"🕒 {time}")
        print(f"✍️ Author ID: {tweet['author_id']}")
        print(f"💬 Text: {text}")
        print(f"📊 Likes: {metrics['like_count']} | Retweets: {metrics['retweet_count']} | Replies: {metrics['reply_count']} | Quotes: {metrics['quote_count']}")
        print("-"*60)
    
    print(f"\n📈 Total Results: {response.get('meta', {}).get('result_count', len(response.get('data', [])))}")

# --- MAIN ---
if __name__ == "__main__":
    data = fetch_tweets(SEARCH_QUERY, TWEET_COUNT)
    print_beautified_tweets(data)
