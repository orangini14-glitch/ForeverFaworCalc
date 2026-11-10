import json
import time
import urllib.request
import urllib.error

# Настройки
MARKET = "forever.normal.horde.us" 

# Список всех ID (ящики + ресурсы), которые нужно отслеживать
ITEM_IDS = [
    248682, 248683, 248684, 248685, 248703, 248704, 248702, 248686, 248687, 248688, 248689, 248706, 248705, 248707, 
    248690, 248691, 248692, 248693, 248694, 248709, 248708, 248710, 248695, 248696, 248697, 248698, 248699, 248712, 248711, 248713,
    2447, 765, 2449, 785, 2450, 3820, 2453, 3355, 3369, 3356, 3357, 3818, 3821, 3358, 3819, 4625, 8831, 8836, 13464, 8838, 8839, 8845, 8846, 13463, 13465, 13466, 13467, 
    2770, 2771, 2775, 2772, 2776, 3858, 7911, 10620, 11370, 2840, 3576, 2841, 2842, 3575, 3860, 3859, 3577, 6037, 12359, 11371, 
    2589, 2592, 4306, 4338, 14047, 2318, 2319, 4234, 4304, 8170, 4231, 4233, 4236, 8172, 
    10940, 11083, 11137, 11176, 10938, 10939, 11082, 11135, 11175, 10978, 11084, 11138, 11139, 11177, 11178, 14343, 14344, 
    4371, 4375, 4382, 10558, 4387, 10559, 10560, 10561, 15994, 18631, 19795, 4359, 4361, 4363, 2996, 2997, 4305, 4339, 14048
]

def fetch_price(item_id):
    url = f"https://auctionhouse.fyi/api/v1/ah/{MARKET}/{item_id}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if data and data.get('row') and data['row'][0] is not None:
                return data['row'][0]  # Цена в меди
    except Exception as e:
        print(f"Ошибка для ID {item_id}: {e}")
    return None

def main():
    prices = {}
    print("Начинаем сбор цен...")
    for item_id in ITEM_IDS:
        price = fetch_price(item_id)
        if price is not None:
            prices[str(item_id)] = price
        time.sleep(0.05) # Пауза, чтобы не забанили

    # Сохраняем в JS-файл
    js_content = f"window.AUCTION_DATA = {json.dumps(prices, indent=2)};"
    with open('auction-data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Готово! Собрано цен: {len(prices)}")

if __name__ == "__main__":
    main()