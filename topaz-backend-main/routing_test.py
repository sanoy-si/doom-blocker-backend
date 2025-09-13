# Compare client vs server latency
import time
import requests
import os

from groq import Groq

headers = {
    "Authorization": f"Bearer {os.getenv("GROQ_API_KEY")}",
    "Content-Type": "application/json",
}

# The payload (body) of the request, converted to a Python dictionary
# NOTE: Using Llama 3.3 70B versatile model - available on Groq free tier with large context.
# NOTE: 'max_completion_tokens' is renamed to 'max_tokens'.
payload = {
    "model": "llama-3.3-70b-versatile",
    # "messages": [
    #   {
    #           "role": "system",
    #           "content": "You are an expert content filtering AI for a grid-based user interface. Your task is to analyze the textual content of UI elements and determine which ones should be hidden based on a set of filtering rules.\n\nYou will be provided with a JSON object representing the current state of the UI. This object details a series of \"grids,\" which are containers for content. These grids could represent lists of video titles, suggestion tags, or YouTube channel names.\n\n**Input Data # Structure:**\n\nThe input you receive will be a JSON object with the following structure:\n\n```json\n{\n  \"timestamp\": \"string (ISO 8601)\",\n  \"totalGrids\": \"integer\",\n  \"grids\": [\n    {\n      \"id\": \"string\",\n      \"gridText\": \"string (joined full text of children)\",\n      \"children\": [\n        {\n          \"id\": \"string (unique within parent grid)\",\n          \"text\": \"string\"\n        }\n      ]\n    }\n  ]\n}\n```\n\n**Your Task:**\n\nAnalyze the `text` # of each `child` element within every `grid` based on the filtering rules below and identify which children should be hidden.\n\n**Filtering Rules:**\n\nYou must adhere to the following whitelist and blacklist rules.\n\n**1. Whitelist (Content to Always Show):**\nYou **MUST NOT** identify content for removal if it falls into the categories listed below. This content should always be displayed.\n\n**2. Blacklist (Content to Hide):**\nYou **MUST** identify content for removal if it falls into # the categories listed below.\n\n**3. Precedence Rule:**\n**The whitelist always takes precedence.** If an item's content matches a category on both the blacklist and the whitelist, you **MUST NOT** identify it for removal. \n\nMake sure your output is a line separated list of children you want removed, e.g.\n```\ng1c0\ng3c4\ng3g6\ng5c3\n```\n\n##Now here is the WHITELIST: \n\n [\n    \"electronic\"\n]\n\n ##Now here is the BLACKLIST: \n\n[\n    \"anything with very little long term value to a # user\",\n    \"clickbait/exaggerated titles\",\n    \"TV/movie clips\",\n    \"brainrot\",\n    \"youtube shorts\",\n    \"youtube playables\",\n    \"shorts\",\n    \"playables\",\n    \"mixes\",\n    \"music\",\n    \"music genres\",\n    \"music videos\"\n]\n\n ##now here is the input structure:\n"
    #         },
    #         {
    #           "role": "user",
    #           "content": "{'timestamp': '2025-07-26T02:21:20.233Z', 'totalGrids': 1, 'grids': [{'id': 'g2', 'children': [{'id': 'g2c22', 'text': '3:23\\nNow playing\\nBeat Haven - Will I Fall - Rock Music\\nBeat Haven\\n44 views\\n2 days ago'}, {'id': 'g2c23', 'text': \"Malevolent Shrine - JJK S2 OST but it's the best part (looped)\\nrngtic\\n577K views\\n1 year ago\"}, {'id': 'g2c24', 'text': \"3:10\\nNow playing\\nElon Musk - I Don't Ever Give Up | Gangsta's Paradise\\nBlockVestor\\n39M views\\n4 years # ago\"}, {'id': 'g2c25', 'text': 'Many Men (1950s Version)\\nLunar Tunes\\n184K views\\n1 year ago'}, {'id': 'g2c26', 'text': '【8bitアレンジ】ダンダダン op Creepy Nuts「オトノケ」 / DAN DADAN op song 8bit-cover\\nまつもり / Matsumori\\n1.8M views\\n9 months ago'}, {'id': 'g2c27', 'text': 'Make Them Hate INVINCIBLE\\nTurbo Virgin\\n857K views\\n4 months ago'}, {'id': 'g2c28', 'text': '7:36\\nNow playing\\nPRIDE. by Kendrick Lamar but it might change your life\\nBillos\\n24K views\\n1 month ago'}, # {'id': 'g2c29', 'text': \"4:59\\nNow playing\\nSuccession 3x03 I The government isn't a fcking Pez dispenser\\ngerrialert\\n221K views\\n3 years ago\"}, {'id': 'g2c30', 'text': 'Mix\\nMix - Electronic music\\nBlack Gryph0n, The Living Tombstone, Tom Cardy, and more\\nUpdated today'}, {'id': 'g2c31', 'text': 'GOJO AND (YUTA) VS SUKUNA l BAD ROMANCE - LADY GAGA\\nAlexander\\n1.6M views\\n1 year ago'}, {'id': 'g2c32', 'text': 'Sorry, I Like You\\nburbank\\n\\n14M views\\n6 years ago'}, {'id': # 'g2c33', 'text': 'If having a podcast was illegal\\nLongBeachGriffy\\n\\n506K views\\n1 year ago'}, {'id': 'g2c34', 'text': 'Die In A Fire - Markiplier (AI Cover)\\nAISongs27\\n1.2M views\\n2 years ago'}, {'id': 'g2c35', 'text': 'Calculus Slander\\nNorthernHurricane7\\n2.1M views\\n2 years ago'}, {'id': 'g2c36', 'text': 'Yuji vs. Sukuna 💥 Jujutsu Kaisen Fan Animation\\nEndeejayy\\n471K views\\n8 months ago'}, {'id': 'g2c37', 'text': 'The Amazing Hands of Tom Brier\\nKeeper1st\\n55K views\# \n17 years ago'}, {'id': 'g2c38', 'text': 'Warm Noise Black Screen 12 hours 😴 Deep Brown Noise for Studying and Sleeping 🎧 Sweet Noise\\nSweet Noise\\n30K views\\n2 years ago'}, {'id': 'g2c39', 'text': 'the gun: Chainsawman edit\\nSheepedits_ \\n387K views\\n11 months ago'}, {'id': 'g2c40', 'text': 'Your Typical Developer Experience\\nAustin Tarango\\n65K views\\n10 days ago'}, {'id': 'g2c41', 'text': 'Superman\\nOso\\n10K views\\n10 days ago'}, {'id': 'g2c42', 'text': 'Imagine Dragons - # Bones (Official Music Video)\\nImagineDragons\\n\\n385M views\\n3 years ago'}, {'id': 'g2c43', 'text': '𝐭𝐢𝐦𝐞𝐥𝐞𝐬𝐬 - 𝐩𝐥𝐚𝐲𝐛𝐨𝐢 𝐜𝐚𝐫𝐭𝐢, 𝐭𝐡𝐞 𝐰𝐞𝐞𝐤𝐧𝐝 (𝐬𝐥𝐢𝐠𝐡𝐭𝐥𝐲 𝐬𝐥𝐨𝐰𝐞𝐝)\\nAbsolute Cinema\\n5.1M views\\n8 months ago'}, {'id': 'g2c44', 'text': 'APT.⚡ | Momo X Okarun (DanDaDan) 4K\\nridg\\n911K views\\n8 months ago'}, {'id': 'g2c45', 'text': 'Senior Manager\\nKRAZAM\\n\\n142K views\\n2 months ago'}]}]}\n"
    #         }
    # ],
    "messages": [
        {
            "role": "system",
            "content": "repeat what the next prompt says"
        },
        {
            "role": "user",
            "content": "oojisjojjsoooosooosooojojojojioioououou"
        }
    ],
    "temperature": 0.6,
    "max_tokens": 4096,
    "top_p": 1,
    "stream": False,
    "stop": None
}


start_time = time.time()
response = requests.post("https://api.groq.com/openai/v1/chat/completions",
                      headers=headers, json=payload)
client_latency = time.time() - start_time
server_latency = response.json()['usage']['total_time']

# Significant delta indicates network optimization opportunity
network_overhead = client_latency - float(server_latency)
print(f"overall latency {client_latency}")
print(f"groq latency {server_latency}")
print("---")
print(f"network overhead {network_overhead}")

# Verify request routing and identify optimization opportunities
routing_headers = ['x-groq-region', 'cf-ray']
for header in routing_headers:
  if header in response.headers:
      print(f"{header}: {response.headers[header]}")

# Example: x-groq-region: us-east-1 shows the datacenter that processed your request
