import gzip
import http.client

def upload_chunk(url, offset, chunk):
    conn = http.client.HTTPConnection("192.168.1.115:8000")
    headers = {"Content-Encoding": "gzip"}
    conn.request("POST", url + "?offset=" + str(offset), chunk, headers)
    response = conn.getresponse()
    if response.status != 200:
        raise Exception("Failed to upload chunk", response.status)
    conn.close()

# Compress the data using gzip
with open('dist/index.html', 'rb') as f_in:
    compressed_data = gzip.compress(f_in.read())

# Split the data into 1KB chunks and upload each chunk
chunk_size = 1024
num_chunks = (len(compressed_data) + chunk_size - 1) // chunk_size
for i in range(num_chunks):
    chunk = compressed_data[i * chunk_size: (i + 1) * chunk_size]
    upload_chunk('/sys/upload-index', i * chunk_size, chunk)
    print(f"Uploaded chunk {i + 1}/{num_chunks}")

