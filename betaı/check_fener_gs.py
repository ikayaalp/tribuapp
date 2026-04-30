import pandas as pd

df = pd.read_csv('superlig_26_hafta_veriler.csv', encoding='utf-8-sig')
m = df[
    ((df['Ev Sahibi']=='Galatasaray') & (df['Deplasman']=='Gençlerbirliği')) |
    ((df['Ev Sahibi']=='Gençlerbirliği') & (df['Deplasman']=='Galatasaray'))
]

for _, r in m.iterrows():
    print(f"Hafta {r['Hafta']}: {r['Ev Sahibi']} vs {r['Deplasman']} ({r['Skor']})")
    print(f"  {r['Ev Sahibi']} (Ev):")
    print(f"    Hucum:   {r['Ev_Eksik_Hucum']} mil. EUR")
    print(f"    Savunma: {r['Ev_Eksik_Savunma']} mil. EUR")
    print(f"    Orta:    {r['Ev_Eksik_Orta']} mil. EUR")
    print(f"  {r['Deplasman']} (Dep):")
    print(f"    Hucum:   {r['Dep_Eksik_Hucum']} mil. EUR")
    print(f"    Savunma: {r['Dep_Eksik_Savunma']} mil. EUR")
    print(f"    Orta:    {r['Dep_Eksik_Orta']} mil. EUR")
    print()
