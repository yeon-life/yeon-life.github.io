import os
import sys
import json
import urllib.request
import urllib.error
import fnmatch
import time
import socket

# Ensure UTF-8 output on Windows
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

TARGET_DIR = os.path.dirname(os.path.abspath(__file__))
# Check if parent directory is the root workspace
PARENT_DIR = os.path.dirname(TARGET_DIR)

def get_ignore_patterns():
    # Try loading firebase.json ignore list
    # Look in current target directory, then parent directory
    paths_to_check = [
        os.path.join(TARGET_DIR, 'firebase.json'),
        os.path.join(PARENT_DIR, 'firebase.json')
    ]
    
    ignore_patterns = [
        '.git',
        'node_modules',
        '**/.*',
        '**/*.py',
        '**/*.bat',
        '**/*.sh',
        '**/*.cmd',
        '**/*.ps1',
        '**/*.zip',
        '_backup_images/**',
        '_samsan_backup_deleted/**'
    ]
    
    for path in paths_to_check:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'hosting' in data and 'ignore' in data['hosting']:
                        custom_ignore = data['hosting']['ignore']
                        # Merge with default ignores
                        for pattern in custom_ignore:
                            if pattern not in ignore_patterns:
                                ignore_patterns.append(pattern)
                break
            except Exception:
                pass
    return ignore_patterns

def is_ignored(path, base_dir, ignore_patterns):
    rel_path = os.path.relpath(path, base_dir).replace('\\', '/')
    
    # Quick checks for common system directories
    parts = rel_path.split('/')
    if '.git' in parts or 'node_modules' in parts or '_backup_images' in parts or '__pycache__' in parts:
        return True
        
    for pattern in ignore_patterns:
        # standard clean paths
        clean_pattern = pattern.replace('\\', '/')
        
        # Check standard matching
        if fnmatch.fnmatch(rel_path, clean_pattern) or fnmatch.fnmatch(rel_path, f"*/{clean_pattern}"):
            return True
        # Check if the path starts with pattern (e.g. tool/**)
        if clean_pattern.endswith('/**'):
            prefix = clean_pattern[:-3]
            if rel_path.startswith(prefix) or rel_path == prefix:
                return True
        if fnmatch.fnmatch(rel_path, f"{clean_pattern}*"):
            return True
            
    return False

def calculate_folder_sizes(base_dir, ignore_patterns):
    total_bytes = 0
    deploy_bytes = 0
    total_files = 0
    deploy_files = 0
    
    large_files = []
    
    for root, dirs, files in os.walk(base_dir):
        # Prevent traversing into .git or node_modules
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '_backup_images', '__pycache__'}]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                size = os.path.getsize(file_path)
            except OSError:
                continue
                
            total_bytes += size
            total_files += 1
            
            # Check if this file is deployed to Firebase Hosting
            if not is_ignored(file_path, base_dir, ignore_patterns):
                deploy_bytes += size
                deploy_files += 1
                
                # Keep track of largest files in deployment
                if size > 1 * 1024 * 1024:  # > 1MB
                    rel_path = os.path.relpath(file_path, base_dir).replace('\\', '/')
                    large_files.append({
                        'path': rel_path,
                        'size': size,
                        'formatted_size': f"{size / (1024 * 1024):.2f} MB"
                    })
                    
    large_files.sort(key=lambda x: x['size'], reverse=True)
    return total_bytes, total_files, deploy_bytes, deploy_files, large_files[:10]

def check_dns_over_https(domain):
    ns_servers = []
    status = "Unknown"
    
    # We query the Cloudflare & Google DNS-over-HTTPS JSON API
    urls = [
        f"https://cloudflare-dns.com/dns-query?name={domain}&type=NS",
        f"https://dns.google/resolve?name={domain}&type=NS"
    ]
    
    for url in urls:
        try:
            req = urllib.request.Request(
                url, 
                headers={'Accept': 'application/dns-json', 'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode('utf-8'))
                if 'Answer' in data:
                    for answer in data['Answer']:
                        if answer.get('type') == 2:  # NS record
                            ns_servers.append(answer.get('data').rstrip('.'))
                    status = "Success"
                    break
        except Exception as e:
            status = f"Query Error: {str(e)}"
            
    # Fallback to local socket getaddrinfo to see if domain resolves at all
    ip_resolved = False
    try:
        socket.getaddrinfo(domain, 80)
        ip_resolved = True
    except Exception:
        pass
        
    return ns_servers, status, ip_resolved

def check_http_status(url):
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=5) as response:
            latency = (time.time() - start_time) * 1000
            return response.getcode(), f"{latency:.0f}ms", None
    except urllib.error.HTTPError as e:
        return e.code, "0ms", f"HTTP Error {e.code}"
    except urllib.error.URLError as e:
        return 0, "0ms", f"URL Error: {e.reason}"
    except Exception as e:
        return 0, "0ms", f"Error: {str(e)}"

def main():
    print("==================================================")
    print("      Yeonlife Infrastructure Status Check        ")
    print("==================================================")
    print(f"Directory: {TARGET_DIR}")
    
    # 1. Calculate file sizes
    print("\n[1/4] Calculating local repository and deployment sizes...")
    ignore_patterns = get_ignore_patterns()
    total_bytes, total_files, deploy_bytes, deploy_files, large_files = calculate_folder_sizes(TARGET_DIR, ignore_patterns)
    
    total_mb = total_bytes / (1024 * 1024)
    deploy_mb = deploy_bytes / (1024 * 1024)
    
    print(f"  Total Local Folder Size: {total_mb:.2f} MB ({total_files} files)")
    print(f"  Estimated Deploy Size: {deploy_mb:.2f} MB ({deploy_files} files)")
    
    # 2. Check DNS Nameservers
    print("\n[2/4] Querying DNS Nameservers for y-life.kr...")
    ns_servers, dns_status, ip_resolved = check_dns_over_https("y-life.kr")
    print(f"  Nameservers found: {', '.join(ns_servers) if ns_servers else 'None'}")
    print(f"  DNS Status: {dns_status}, IP Resolved: {ip_resolved}")
    
    # 3. Check Website HTTP Connections
    print("\n[3/4] Testing HTTP connection states...")
    cf_pages_code, cf_pages_latency, cf_pages_err = check_http_status("https://yeon-life.pages.dev")
    custom_domain_code, custom_domain_latency, custom_domain_err = check_http_status("https://y-life.kr")
    
    print(f"  yeon-life.pages.dev: HTTP {cf_pages_code} ({cf_pages_latency})")
    print(f"  y-life.kr: HTTP {custom_domain_code} ({custom_domain_latency})")
    
    # 4. Generate JSON Report
    print("\n[4/4] Generating status report json file...")
    
    # Determine Gabia (nameserver mapping) status
    # Gabia nameservers should contain cloudflare
    is_routed_to_cf = any('cloudflare' in ns.lower() for ns in ns_servers)
    
    gabia_status = "OK"
    if not ns_servers:
        gabia_status = "UNKNOWN" if dns_status != "Success" else "NO_NS_RECORDS"
    elif not is_routed_to_cf:
        gabia_status = "NOT_ROUTED_TO_CLOUDFLARE"
        
    # Estimate Firebase Hosting storage (assuming release history limit is 2)
    # Recommended limit is 2. Let's make it 2 for calculation.
    firebase_history_limit = 2
    estimated_firebase_storage_mb = deploy_mb * firebase_history_limit
    
    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()),
        'timestamp_epoch': int(time.time()),
        'local_repo': {
            'path': TARGET_DIR,
            'total_size_bytes': total_bytes,
            'total_size_formatted': f"{total_mb:.2f} MB",
            'total_files': total_files
        },
        'firebase_deploy': {
            'deploy_size_bytes': deploy_bytes,
            'deploy_size_formatted': f"{deploy_mb:.2f} MB",
            'deploy_files': deploy_files,
            'history_limit': firebase_history_limit,
            'estimated_storage_bytes': deploy_bytes * firebase_history_limit,
            'estimated_storage_formatted': f"{estimated_firebase_storage_mb:.2f} MB",
            'storage_limit_bytes': 10 * 1024 * 1024 * 1024, # 10 GB
            'storage_usage_percent': (estimated_firebase_storage_mb / 10240) * 100
        },
        'dns': {
            'domain': 'y-life.kr',
            'nameservers': ns_servers,
            'is_cloudflare_ns': is_routed_to_cf,
            'ip_resolved': ip_resolved,
            'gabia_status': gabia_status
        },
        'websites': {
            'cloudflare_pages': {
                'url': 'https://yeon-life.pages.dev',
                'status_code': cf_pages_code,
                'latency': cf_pages_latency,
                'error': cf_pages_err
            },
            'custom_domain': {
                'url': 'https://y-life.kr',
                'status_code': custom_domain_code,
                'latency': custom_domain_latency,
                'error': custom_domain_err
            }
        },
        'large_files': large_files
    }
    
    output_path = os.path.join(TARGET_DIR, 'infra_status.json')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"  [OK] Saved status report to: {output_path}")
    except Exception as e:
        print(f"  [ERROR] Failed to save JSON report: {str(e)}")
        sys.exit(1)
        
    print("\nScan completed successfully!")

if __name__ == '__main__':
    main()
