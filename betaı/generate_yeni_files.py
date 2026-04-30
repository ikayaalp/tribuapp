import os
import json
import pandas as pd

# all_leagues_analiz.py from previous logic for just Port & Ned
from all_leagues_analiz import process_league

def main():
    # Make sure we have the correct output files with '_yeni'
    configs = [
        {
            "name": "Eredivisie", 
            "lid": 72, 
            "json": "eredivisie_2026.json", 
            "csv_in": "eredivisie_raw.csv", 
            "csv_out": "eredivisie_veriler_final_yeni.csv"
        },
        {
            "name": "Liga Portugal", 
            "lid": 462, 
            "json": "liga_portugal_2026.json", 
            "csv_in": "liga_portugal_raw.csv", 
            "csv_out": "liga_portugal_veriler_final_yeni.csv"
        }
    ]
    
    for conf in configs:
        print(f"--- Checking {conf['name']} ---")
        if os.path.exists(conf["json"]):
            with open(conf["json"], "r", encoding="utf-8") as f:
                players = json.load(f)
                teams = set([p['takim'] for p in players])
                print(f"Oyuncu verileri mevcut: {len(players)} oyuncu, {len(teams)} takım.")
        else:
            print("HATA: JSON dosyası yok!")
            
        print("Final dosya oluşturuluyor...")
        process_league(conf)
        print("\n")

if __name__ == "__main__":
    main()
