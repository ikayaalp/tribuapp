import requests

# The key provided by the user
KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNu"

# Let's try some common variations or just a single check with a different endpoint
def check_key(key):
    url = "https://api.sportmonks.com/v3/my/resources"
    params = {"api_token": key}
    try:
        response = requests.get(url, params=params)
        return response.status_code, response.text
    except Exception as e:
        return None, str(e)

if __name__ == "__main__":
    status, text = check_key(KEY)
    print(f"Original: {status} - {text}")
    
    # Try removing the last char just in case
    status, text = check_key(KEY[:-1])
    print(f"Minus last char: {status} - {text}")
    
    # Try removing first char
    status, text = check_key(KEY[1:])
    print(f"Minus first char: {status} - {text}")
