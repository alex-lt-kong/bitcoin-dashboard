import os
import requests
import sqlite3
import matplotlib.pyplot as plt

app_dir = os.path.dirname(os.path.realpath(__file__))

interval = 1000
url_latestblock = 'https://blockstream.info/api/blocks'
resp = requests.get(url_latestblock)
latest_block = resp.json()[0]
latest_height = latest_block['height']

one_thousandth_block_count = latest_height // interval
tx_counts = [0] * interval
labels = [1] * interval

con = sqlite3.connect(f'file:{app_dir}/block-stat.sqlite?mode=ro', uri=True)
cur = con.cursor()
for i in range(interval):
    res = cur.execute(
        '''
        SELECT SUM(tx_count) FROM block_test_result
        WHERE block_height >= ? AND block_height < ?
        ''',
        (i * one_thousandth_block_count, (i+1) * one_thousandth_block_count)
    )
    rows = res.fetchall()
    tx_counts[i] = 0 if rows[0][0] is None else rows[0][0]
    # tx_counts[i] = rows[0][0]
    labels[i] = i * one_thousandth_block_count

fig, ax = plt.subplots(figsize=(48, 6))
ax.margins(0)
ax.tick_params(axis='x', which='major', labelsize=32)
ax.tick_params(axis='y', which='major', labelsize=0)
ax.plot(labels, tx_counts, linewidth=6)
plt.savefig(os.path.join(app_dir, 'public/img/chart.png'), bbox_inches='tight')
