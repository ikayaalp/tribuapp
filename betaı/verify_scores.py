import json

def verify_and_refresh():
    try:
        with open('superlig_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        non_zero_xg = [m['Ev xG'] for m in data if m.get('Ev xG', 0) > 0]
        print(f"Total matches: {len(data)}")
        print(f"Matches with non-zero xG: {len(non_zero_xg)}")
        if non_zero_xg:
            print(f"Sample xG values: {non_zero_xg[:5]}")
        
        # Refresh data.js
        with open('dashboard/data.js', 'w', encoding='utf-8') as f:
            f.write('var fullData = ' + json.dumps(data) + ';')
        print("dashboard/data.js updated with real xG data.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_and_refresh()
