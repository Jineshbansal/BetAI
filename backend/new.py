import json
from newsapi import NewsApiClient

# Initialize API
newsapi = NewsApiClient(api_key="0c17b412e22846c6b1ce4cd63d5d9fb4")

query = "bitcoin price prediction OR will bitcoin reach 80000 OR btc forecast"

# Fetch relevant news
response = newsapi.get_everything(
    q=query,
    language="en",
    sort_by="publishedAt",
    page_size=10
)

# Pretty print raw JSON (optional)
# print(json.dumps(response, indent=4, ensure_ascii=False))

print("\n💹 BITCOIN PRICE PREDICTION NEWS (Will BTC reach $80K?)\n")

if response["status"] == "ok" and response["totalResults"] > 0:
    for i, article in enumerate(response["articles"], 1):
        print(f"📰  {i}. {article['title']}")
        print(f"    🏷️  Source: {article['source']['name']}")
        print(f"    ✍️  Author: {article.get('author', 'Unknown')}")
        print(f"    📅  Published: {article['publishedAt']}")
        print(f"    🔗  URL: {article['url']}")
        print(f"    💬  {article.get('description', '')[:200]}...\n")
else:
    print("⚠️  No Bitcoin prediction news found right now. Try adjusting your query or timeframe.\n")
