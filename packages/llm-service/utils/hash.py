import hashlib

def calculate_hash(*file_paths):
    md5_hash = hashlib.md5()
    for file_path in file_paths:
        with open(file_path, 'rb') as file:
            for chunk in iter(lambda: file.read(4096), b""):
                md5_hash.update(chunk)
    return md5_hash.hexdigest()