#!/usr/bin/env python3
"""
POS Karczma - Skaner środowiskowy v3.0
Kompleksowe sprawdzenie gotowości komputera do instalacji systemu POS.
Wykrywa i odczytuje konfigurację istniejącej instalacji Bistro Simplex.

Autor: POS Karczma Team
"""

import socket
import subprocess
import platform
import os
import sys
import json
import glob
import ctypes
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from configparser import ConfigParser

# Windows-specific imports
try:
    import winreg
    HAS_WINREG = True
except ImportError:
    HAS_WINREG = False

VERSION = "3.1.0"

# ============================================================
# KONFIGURACJA SERWERA
# ============================================================

# Adres serwera POS Karczma - UZUPEŁNIANY AUTOMATYCZNIE przy pobieraniu
# Jeśli pusty, skaner zapyta o adres na końcu
POS_SERVER_URL = ""

# ============================================================
# KONFIGURACJA
# ============================================================

# Wymagania minimalne
MIN_RAM_GB = 4
RECOMMENDED_RAM_GB = 8
MIN_DISK_GB = 5
RECOMMENDED_DISK_GB = 10
MIN_NODE_VERSION = 18

# Porty do sprawdzenia
REQUIRED_PORTS = {
    3000: ("Next.js dev", True),      # (opis, czy musi być wolny)
    3001: ("Next.js prod", True),
    3306: ("MySQL", False),            # powinien być zajęty jeśli MySQL działa
    6379: ("Redis", False),
    9000: ("Webhook", True),
    9100: ("Drukarka RAW", False),
}

# Lokalizacje Bistro Simplex
BISTRO_SEARCH_PATHS = [
    "C:\\Small Business", "C:\\Bistro", "C:\\Symplex",
    "C:\\Program Files\\Symplex", "C:\\Program Files (x86)\\Symplex",
    "D:\\Small Business", "D:\\Bistro", "E:\\Small Business",
]

BISTRO_INDICATORS = ['bistro.exe', 'sb.exe', 'smallbusiness.exe', 'bistro.ini', 'sb.ini', 'g0000000.MGR']
BISTRO_CONFIG_FILES = ['bistro.ini', 'bistro.cfg', 'sb.ini', 'small.ini', 'config.ini', 'drukarki.ini', 'operatorzy.ini']
BISTRO_DATA_EXTENSIONS = ['.MGR', '.TOW', '.KON', '.DOK', '.PAR', '.OPE', '.STO', '.GRU', '.DRU']

# ============================================================
# KOLOROWANIE KONSOLI
# ============================================================

class Colors:
    OK = '\033[92m'
    WARN = '\033[93m'
    FAIL = '\033[91m'
    INFO = '\033[94m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'

def setup_console():
    """Konfiguruje konsolę Windows."""
    if platform.system() == 'Windows':
        os.system('')  # Włącza ANSI escape codes
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, TypeError):
            pass

setup_console()
USE_COLORS = hasattr(sys.stdout, 'isatty') and sys.stdout.isatty()

def col(text: str, color: str) -> str:
    return f"{color}{text}{Colors.END}" if USE_COLORS else text

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', 'replace').decode('ascii'))

def header(title: str):
    safe_print("\n" + col("=" * 70, Colors.DIM))
    safe_print(col(f"  {title}", Colors.BOLD))
    safe_print(col("=" * 70, Colors.DIM))

def result(name: str, status: str, detail: str = ""):
    icons = {'ok': '[OK]', 'warn': '[!]', 'fail': '[X]', 'info': '[i]', 'found': '[*]'}
    colors = {'ok': Colors.OK, 'warn': Colors.WARN, 'fail': Colors.FAIL, 'info': Colors.INFO, 'found': Colors.OK}
    icon = col(icons.get(status, '[?]'), colors.get(status, ''))
    safe_print(f"  {icon} {name}")
    if detail:
        for line in detail.split('\n'):
            safe_print(f"      {line}")

# ============================================================
# FUNKCJE POMOCNICZE
# ============================================================

def run_cmd(cmd: str, timeout: int = 10) -> Tuple[bool, str]:
    """Uruchamia komendę shell i zwraca wynik."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, timeout=timeout,
            encoding='utf-8', errors='replace'
        )
        output = result.stdout.strip() or result.stderr.strip()
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except Exception as e:
        return False, str(e)

def check_port(host: str, port: int, timeout: float = 1.0) -> bool:
    """Sprawdza czy port jest otwarty."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def get_local_ip() -> str:
    """Pobiera lokalne IP komputera."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "nieznane"

def is_admin() -> bool:
    """Sprawdza czy skrypt uruchomiono jako administrator."""
    if platform.system() != 'Windows':
        return os.geteuid() == 0
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def get_windows_version() -> Dict[str, str]:
    """Pobiera szczegółową wersję Windows."""
    info = {
        'name': platform.system(),
        'release': platform.release(),
        'version': platform.version(),
        'edition': '',
        'build': '',
    }
    if platform.system() == 'Windows':
        # Pobierz build z wersji platformy
        try:
            ver_parts = platform.version().split('.')
            if len(ver_parts) >= 3:
                info['build'] = ver_parts[2]
        except:
            pass
        
        # Pobierz edycję przez PowerShell (bardziej niezawodne niż wmic)
        try:
            ok, out = run_cmd('powershell -Command "(Get-CimInstance Win32_OperatingSystem).Caption"')
            if ok and out.strip():
                info['edition'] = out.strip()
        except:
            pass
        
        # Fallback jeśli PowerShell nie zadziała
        if not info['edition']:
            try:
                ok, out = run_cmd('wmic os get Caption /value')
                if ok and 'Caption=' in out:
                    info['edition'] = out.split('Caption=')[1].strip().split('\n')[0]
            except:
                pass
    return info

def get_memory_info() -> Dict[str, float]:
    """Pobiera informacje o pamięci RAM."""
    info = {'total_gb': 0, 'available_gb': 0, 'used_percent': 0}
    if platform.system() == 'Windows':
        try:
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]
            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(stat)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
            info['total_gb'] = stat.ullTotalPhys / (1024**3)
            info['available_gb'] = stat.ullAvailPhys / (1024**3)
            info['used_percent'] = stat.dwMemoryLoad
        except:
            pass
    return info

def get_disk_info(drive: str = "C:") -> Dict[str, float]:
    """Pobiera informacje o dysku."""
    info = {'total_gb': 0, 'free_gb': 0, 'used_percent': 0}
    if platform.system() == 'Windows':
        try:
            free = ctypes.c_ulonglong(0)
            total = ctypes.c_ulonglong(0)
            ctypes.windll.kernel32.GetDiskFreeSpaceExW(
                ctypes.c_wchar_p(drive + "\\"), None, ctypes.pointer(total), ctypes.pointer(free)
            )
            info['total_gb'] = total.value / (1024**3)
            info['free_gb'] = free.value / (1024**3)
            info['used_percent'] = round((1 - free.value / total.value) * 100) if total.value else 0
        except:
            pass
    return info

def get_cpu_info() -> Dict[str, Any]:
    """Pobiera informacje o procesorze."""
    info = {'name': platform.processor(), 'cores': os.cpu_count() or 0, 'arch': platform.machine()}
    if platform.system() == 'Windows':
        try:
            ok, out = run_cmd('powershell -Command "(Get-CimInstance Win32_Processor).Name"')
            if ok and out.strip():
                info['name'] = out.strip()
        except:
            pass
    return info

# ============================================================
# SPRAWDZANIE OPROGRAMOWANIA
# ============================================================

def check_node() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza Node.js."""
    info = {'installed': False, 'version': '', 'path': ''}
    ok, out = run_cmd('node --version')
    if ok and out.startswith('v'):
        version = out.lstrip('v').strip()
        info['installed'] = True
        info['version'] = version
        try:
            major = int(version.split('.')[0])
            if major >= MIN_NODE_VERSION:
                return 'ok', f"Node.js {version}", info
            return 'fail', f"Node.js {version} - wymagana wersja {MIN_NODE_VERSION}+", info
        except:
            return 'warn', f"Node.js {version} - nie mozna sprawdzic wersji", info
    return 'fail', "Node.js nie zainstalowany", info

def check_npm() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza npm."""
    info = {'installed': False, 'version': ''}
    ok, out = run_cmd('npm --version')
    if ok:
        info['installed'] = True
        info['version'] = out.strip()
        return 'ok', f"npm {out.strip()}", info
    return 'fail', "npm nie zainstalowany", info

def check_git() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza Git."""
    info = {'installed': False, 'version': ''}
    ok, out = run_cmd('git --version')
    if ok:
        info['installed'] = True
        info['version'] = out.replace('git version ', '').strip()
        return 'ok', f"Git {info['version']}", info
    return 'warn', "Git nie zainstalowany (zalecany)", info

def check_python() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza Python."""
    info = {'version': platform.python_version(), 'path': sys.executable}
    return 'ok', f"Python {info['version']}", info

# ============================================================
# SPRAWDZANIE BAZ DANYCH
# ============================================================

def check_mysql() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza MySQL/MariaDB."""
    info = {'running': False, 'version': '', 'service': False, 'port': 3306}
    
    # Sprawdź port
    info['running'] = check_port('localhost', 3306)
    
    # Sprawdź usługę Windows
    if platform.system() == 'Windows':
        ok, out = run_cmd('sc query MySQL')
        if not ok:
            ok, out = run_cmd('sc query MariaDB')
        if ok and 'RUNNING' in out:
            info['service'] = True
    
    # Sprawdź wersję przez CLI
    ok, out = run_cmd('mysql --version')
    if ok:
        info['version'] = out.strip()
    
    if info['running']:
        return 'ok', f"MySQL dziala na porcie 3306", info
    elif info['service']:
        return 'warn', "Usluga MySQL istnieje ale port zamkniety", info
    return 'fail', "MySQL/MariaDB nie wykryty - WYMAGANY", info

def check_redis() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza Redis."""
    info = {'running': False, 'version': ''}
    info['running'] = check_port('localhost', 6379)
    
    if info['running']:
        # Próba pobrania wersji
        try:
            ok, out = run_cmd('redis-cli info server')
            if ok and 'redis_version' in out:
                for line in out.split('\n'):
                    if line.startswith('redis_version:'):
                        info['version'] = line.split(':')[1].strip()
        except:
            pass
        return 'ok', f"Redis dziala na porcie 6379", info
    return 'warn', "Redis niedostepny (opcjonalny, ale zalecany)", info

# ============================================================
# SPRAWDZANIE SIECI I PORTÓW
# ============================================================

def check_required_ports() -> Dict[int, Dict[str, Any]]:
    """Sprawdza wymagane porty."""
    results = {}
    for port, (desc, should_be_free) in REQUIRED_PORTS.items():
        is_open = check_port('localhost', port)
        status = 'ok'
        if should_be_free and is_open:
            status = 'warn'  # Port powinien być wolny ale jest zajęty
        elif not should_be_free and not is_open:
            status = 'info'  # Port powinien być zajęty (usługa) ale jest wolny
        results[port] = {
            'description': desc,
            'in_use': is_open,
            'should_be_free': should_be_free,
            'status': status,
        }
    return results

def get_network_info() -> Dict[str, Any]:
    """Pobiera informacje o sieci."""
    info = {
        'hostname': socket.gethostname(),
        'local_ip': get_local_ip(),
        'interfaces': [],
        'gateway': '',
        'dns': [],
    }
    
    # Pobierz więcej info przez ipconfig
    if platform.system() == 'Windows':
        ok, out = run_cmd('ipconfig /all')
        if ok:
            lines = out.split('\n')
            for i, line in enumerate(lines):
                if 'IPv4' in line and ':' in line:
                    ip = line.split(':')[-1].strip().replace('(Preferred)', '').strip()
                    if ip and ip not in ['', info['local_ip']]:
                        info['interfaces'].append({'type': 'IPv4', 'address': ip})
                if 'Default Gateway' in line and ':' in line:
                    gw = line.split(':')[-1].strip()
                    if gw:
                        info['gateway'] = gw
                if 'DNS Servers' in line and ':' in line:
                    dns = line.split(':')[-1].strip()
                    if dns:
                        info['dns'].append(dns)
    
    return info

def check_firewall() -> Tuple[str, str, Dict[str, Any]]:
    """Sprawdza stan firewalla Windows."""
    info = {'enabled': False, 'profiles': {}}
    
    if platform.system() != 'Windows':
        return 'info', "Nie Windows - pominieto", info
    
    ok, out = run_cmd('netsh advfirewall show allprofiles state')
    if ok:
        info['enabled'] = 'ON' in out.upper()
        # Parsuj profile
        current_profile = ''
        for line in out.split('\n'):
            if 'Profile' in line:
                current_profile = line.split()[0]
            if 'State' in line:
                state = 'ON' in line.upper()
                if current_profile:
                    info['profiles'][current_profile] = state
    
    if info['enabled']:
        return 'warn', "Firewall wlaczony - moze blokowac porty", info
    return 'ok', "Firewall wylaczony", info

# ============================================================
# SPRAWDZANIE SPRZĘTU
# ============================================================

def get_com_ports() -> List[Dict[str, str]]:
    """Pobiera listę portów COM."""
    ports = []
    
    if platform.system() != 'Windows':
        return ports
    
    # Metoda 1: Przez rejestr
    if HAS_WINREG:
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DEVICEMAP\SERIALCOMM")
            i = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(key, i)
                    ports.append({'port': value, 'description': name, 'source': 'registry'})
                    i += 1
                except WindowsError:
                    break
            winreg.CloseKey(key)
        except:
            pass
    
    # Metoda 2: Przez mode
    ok, out = run_cmd('mode')
    if ok:
        for line in out.split('\n'):
            if line.strip().startswith('COM') and ':' in line:
                port = line.split(':')[0].strip()
                if port and not any(p['port'] == port for p in ports):
                    ports.append({'port': port, 'description': 'active', 'source': 'mode'})
    
    return ports

def get_windows_printers() -> List[Dict[str, str]]:
    """Pobiera listę drukarek zainstalowanych w Windows."""
    printers = []
    
    if platform.system() != 'Windows':
        return printers
    
    # Użyj PowerShell (bardziej niezawodne)
    ok, out = run_cmd('powershell -Command "Get-Printer | Select-Object Name,PortName,DriverName | ConvertTo-Csv -NoTypeInformation"')
    if ok:
        lines = [l.strip().strip('"') for l in out.split('\n') if l.strip()]
        for line in lines[1:]:  # Skip header
            parts = [p.strip('"') for p in line.split('","')]
            if len(parts) >= 3:
                printers.append({
                    'name': parts[0],
                    'port': parts[1],
                    'driver': parts[2],
                })
    
    return printers

def scan_network_printers(timeout: float = 0.3) -> List[Dict[str, str]]:
    """Skanuje sieć w poszukiwaniu drukarek."""
    printers = []
    printer_ports = [9100, 515, 631]
    
    local_ip = get_local_ip()
    if local_ip == "nieznane":
        return printers
    
    # Pobierz prefix sieci
    parts = local_ip.split('.')
    if len(parts) != 4:
        return printers
    prefix = '.'.join(parts[:3])
    
    # Skanuj typowe adresy (rozszerzony zakres)
    addresses_to_scan = [
        '127.0.0.1',
        f'{prefix}.1',      # router/gateway
    ]
    # Dodaj zakres popularnych adresów drukarek
    for i in [100, 101, 102, 150, 200, 201, 202, 250, 251, 252, 253, 254]:
        addresses_to_scan.append(f'{prefix}.{i}')
    
    for addr in addresses_to_scan:
        for port in printer_ports:
            if check_port(addr, port, timeout):
                port_type = {9100: 'RAW/JetDirect', 515: 'LPD', 631: 'IPP/CUPS'}.get(port, 'unknown')
                printers.append({
                    'address': addr,
                    'port': port,
                    'type': port_type,
                    'full_address': f"{addr}:{port}",
                })
    
    return printers

def get_display_info() -> List[Dict[str, Any]]:
    """Pobiera informacje o monitorach."""
    displays = []
    
    if platform.system() != 'Windows':
        return displays
    
    # Użyj PowerShell dla lepszej kompatybilności
    ok, out = run_cmd('powershell -Command "Get-CimInstance Win32_VideoController | Select-Object Name,CurrentHorizontalResolution,CurrentVerticalResolution | ConvertTo-Csv -NoTypeInformation"')
    if ok:
        lines = [l.strip() for l in out.split('\n') if l.strip()]
        for line in lines[1:]:  # Skip header
            parts = [p.strip('"') for p in line.split('","')]
            if len(parts) >= 3:
                name = parts[0] or 'Unknown'
                h_res = parts[1] if parts[1] else ''
                v_res = parts[2] if parts[2] else ''
                resolution = f"{h_res}x{v_res}" if h_res and v_res else 'Unknown'
                displays.append({'name': name, 'resolution': resolution})
    
    return displays

# ============================================================
# WYKRYWANIE BISTRO SIMPLEX
# ============================================================

def find_bistro_installations() -> List[str]:
    """Szuka instalacji Bistro Simplex."""
    found = []
    
    # Sprawdź typowe lokalizacje
    for path in BISTRO_SEARCH_PATHS:
        if os.path.isdir(path) and is_bistro_directory(path):
            found.append(path)
    
    # Szukaj w rejestrze
    if HAS_WINREG:
        for reg_path in find_bistro_in_registry():
            if reg_path not in found and os.path.isdir(reg_path):
                if is_bistro_directory(reg_path):
                    found.append(reg_path)
    
    # Szukaj na dyskach (tylko główne katalogi)
    for drive in ['C', 'D', 'E']:
        drive_path = f"{drive}:\\"
        if os.path.exists(drive_path):
            try:
                for item in os.listdir(drive_path):
                    full_path = os.path.join(drive_path, item)
                    if os.path.isdir(full_path) and full_path not in found:
                        if is_bistro_directory(full_path):
                            found.append(full_path)
            except:
                pass
    
    return found

def find_bistro_in_registry() -> List[str]:
    """Szuka ścieżek Bistro w rejestrze Windows."""
    paths = []
    if not HAS_WINREG:
        return paths
    
    registry_locations = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Symplex"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Symplex\Bistro"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Symplex"),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Symplex"),
    ]
    
    for hkey, key_path in registry_locations:
        try:
            key = winreg.OpenKey(hkey, key_path)
            for value_name in ['InstallPath', 'Path', 'DataPath', 'WorkDir']:
                try:
                    value, _ = winreg.QueryValueEx(key, value_name)
                    if value and value not in paths:
                        paths.append(value)
                except:
                    pass
            winreg.CloseKey(key)
        except:
            pass
    
    return paths

def is_bistro_directory(path: str) -> bool:
    """Sprawdza czy katalog zawiera Bistro Simplex."""
    try:
        items = os.listdir(path)
        items_lower = [i.lower() for i in items]
        
        # Sprawdź wskaźniki
        for indicator in BISTRO_INDICATORS:
            if indicator.lower() in items_lower:
                return True
        
        # Sprawdź pliki .MGR
        for item in items:
            if item.upper().endswith('.MGR'):
                return True
        
        return False
    except:
        return False

def analyze_bistro(path: str) -> Dict[str, Any]:
    """Analizuje instalację Bistro Simplex."""
    info = {
        'path': path,
        'version': '',
        'config_files': [],
        'data_files': {},
        'printers': [],
        'operators': [],
        'size_mb': 0,
        'settings': {},
    }
    
    try:
        # Rozmiar
        total_size = 0
        for root, _, files in os.walk(path):
            for f in files:
                try:
                    total_size += os.path.getsize(os.path.join(root, f))
                except:
                    pass
            break  # Tylko główny katalog dla szybkości
        info['size_mb'] = round(total_size / (1024 * 1024), 1)
        
        # Pliki konfiguracyjne
        for cfg in BISTRO_CONFIG_FILES:
            cfg_path = os.path.join(path, cfg)
            if os.path.isfile(cfg_path):
                info['config_files'].append(cfg)
                # Parsuj INI
                settings = parse_ini_file(cfg_path)
                info['settings'].update(settings)
        
        # Policz pliki danych
        for ext in BISTRO_DATA_EXTENSIONS:
            pattern = os.path.join(path, f"*{ext}")
            files = glob.glob(pattern, recursive=False)
            if files:
                info['data_files'][ext] = len(files)
        
        # Wersja z EXE
        for exe in ['bistro.exe', 'sb.exe']:
            exe_path = os.path.join(path, exe)
            if os.path.isfile(exe_path):
                ok, out = run_cmd(f'powershell -Command "(Get-Item \'{exe_path}\').VersionInfo.FileVersion"')
                if ok and out.strip():
                    info['version'] = out.strip()
                    break
        
        # Parsuj drukarki i operatorów z ustawień
        info['printers'] = extract_printers_from_settings(info['settings'])
        info['operators'] = extract_operators_from_settings(info['settings'])
        
    except Exception as e:
        info['error'] = str(e)
    
    return info

def parse_ini_file(path: str) -> Dict[str, Any]:
    """Parsuje plik INI."""
    settings = {}
    encodings = ['cp1250', 'utf-8', 'latin-1', 'cp852']
    
    for encoding in encodings:
        try:
            config = ConfigParser(interpolation=None)
            config.read(path, encoding=encoding)
            for section in config.sections():
                settings[section] = dict(config.items(section))
            if settings:
                break
        except:
            continue
    
    return settings

def extract_printers_from_settings(settings: Dict[str, Any]) -> List[Dict[str, str]]:
    """Wyciąga konfigurację drukarek z ustawień."""
    printers = []
    printer_keywords = ['drukark', 'printer', 'fiscal', 'kitchen', 'kuchni', 'bon']
    
    for section, values in settings.items():
        if not isinstance(values, dict):
            continue
        if any(kw in section.lower() for kw in printer_keywords):
            printer = {
                'section': section,
                'name': values.get('nazwa', values.get('name', section)),
                'type': values.get('typ', values.get('type', '')),
                'port': values.get('port', values.get('com', '')),
                'address': values.get('adres', values.get('ip', values.get('address', ''))),
            }
            if any(v for v in printer.values() if v and v != section):
                printers.append(printer)
    
    return printers

def extract_operators_from_settings(settings: Dict[str, Any]) -> List[Dict[str, str]]:
    """Wyciąga listę operatorów z ustawień."""
    operators = []
    operator_keywords = ['operator', 'kelner', 'user', 'uzytkownik', 'pracownik']
    
    for section, values in settings.items():
        if not isinstance(values, dict):
            continue
        if any(kw in section.lower() for kw in operator_keywords):
            name = values.get('nazwa', values.get('name', values.get('imie', '')))
            if name:
                operators.append({
                    'name': name,
                    'role': values.get('rola', values.get('role', values.get('stanowisko', ''))),
                    'has_pin': '****' if values.get('pin', values.get('haslo', '')) else '',
                })
    
    return operators

# ============================================================
# GENEROWANIE RAPORTU
# ============================================================

def generate_report() -> Dict[str, Any]:
    """Generuje pełny raport środowiskowy."""
    report = {
        'meta': {
            'version': VERSION,
            'timestamp': datetime.now().isoformat(),
            'hostname': socket.gethostname(),
            'scanner_admin': is_admin(),
        },
        'platform': {},
        'hardware': {},
        'software': {},
        'databases': {},
        'network': {},
        'ports': {},
        'printers': {},
        'bistro': [],
        'checks': {},
        'recommendations': [],
    }
    
    # ===== SYSTEM =====
    header("INFORMACJE O SYSTEMIE")
    
    win_info = get_windows_version()
    report['platform'] = win_info
    result('System', 'info', f"{win_info.get('edition') or win_info['name']} {win_info['release']}")
    result('Build', 'info', win_info.get('build', 'nieznany'))
    result('Architektura', 'info', platform.machine())
    
    admin_status = 'ok' if is_admin() else 'warn'
    result('Uprawnienia', admin_status, 'Administrator' if is_admin() else 'Uzytkownik (niektore funkcje ograniczone)')
    report['checks']['admin'] = {'status': admin_status, 'is_admin': is_admin()}
    
    # ===== SPRZĘT =====
    header("SPRZET")
    
    cpu = get_cpu_info()
    report['hardware']['cpu'] = cpu
    result('Procesor', 'info', f"{cpu['name']} ({cpu['cores']} rdzeni)")
    
    mem = get_memory_info()
    report['hardware']['memory'] = mem
    mem_status = 'ok' if mem['total_gb'] >= RECOMMENDED_RAM_GB else ('warn' if mem['total_gb'] >= MIN_RAM_GB else 'fail')
    result('RAM', mem_status, f"{mem['total_gb']:.1f} GB (dostepne: {mem['available_gb']:.1f} GB, uzycie: {mem['used_percent']}%)")
    report['checks']['memory'] = {'status': mem_status, 'total_gb': mem['total_gb']}
    
    disk = get_disk_info()
    report['hardware']['disk'] = disk
    disk_status = 'ok' if disk['free_gb'] >= RECOMMENDED_DISK_GB else ('warn' if disk['free_gb'] >= MIN_DISK_GB else 'fail')
    result('Dysk C:', disk_status, f"{disk['free_gb']:.1f} GB wolne z {disk['total_gb']:.1f} GB ({disk['used_percent']}% zajete)")
    report['checks']['disk'] = {'status': disk_status, 'free_gb': disk['free_gb']}
    
    displays = get_display_info()
    report['hardware']['displays'] = displays
    for disp in displays:
        result('Monitor', 'info', f"{disp['name']} - {disp['resolution']}")
    
    # ===== OPROGRAMOWANIE =====
    header("OPROGRAMOWANIE")
    
    node_status, node_detail, node_info = check_node()
    result('Node.js', node_status, node_detail)
    report['software']['nodejs'] = node_info
    report['checks']['nodejs'] = {'status': node_status, 'version': node_info.get('version', '')}
    
    npm_status, npm_detail, npm_info = check_npm()
    result('npm', npm_status, npm_detail)
    report['software']['npm'] = npm_info
    report['checks']['npm'] = {'status': npm_status}
    
    git_status, git_detail, git_info = check_git()
    result('Git', git_status, git_detail)
    report['software']['git'] = git_info
    report['checks']['git'] = {'status': git_status}
    
    py_status, py_detail, py_info = check_python()
    result('Python', py_status, py_detail)
    report['software']['python'] = py_info
    
    # ===== BAZY DANYCH =====
    header("BAZY DANYCH")
    
    mysql_status, mysql_detail, mysql_info = check_mysql()
    result('MySQL/MariaDB', mysql_status, mysql_detail)
    report['databases']['mysql'] = mysql_info
    report['checks']['mysql'] = {'status': mysql_status, 'running': mysql_info['running']}
    
    redis_status, redis_detail, redis_info = check_redis()
    result('Redis', redis_status, redis_detail)
    report['databases']['redis'] = redis_info
    report['checks']['redis'] = {'status': redis_status, 'running': redis_info['running']}
    
    # ===== SIEĆ =====
    header("SIEC")
    
    net_info = get_network_info()
    report['network'] = net_info
    result('Hostname', 'info', net_info['hostname'])
    result('IP lokalne', 'info', net_info['local_ip'])
    if net_info['gateway']:
        result('Brama', 'info', net_info['gateway'])
    if net_info['dns']:
        result('DNS', 'info', ', '.join(net_info['dns'][:2]))
    
    fw_status, fw_detail, fw_info = check_firewall()
    result('Firewall', fw_status, fw_detail)
    report['network']['firewall'] = fw_info
    report['checks']['firewall'] = {'status': fw_status, 'enabled': fw_info.get('enabled', False)}
    
    # ===== PORTY =====
    header("PORTY SIECIOWE")
    
    ports_info = check_required_ports()
    report['ports'] = ports_info
    
    port_issues = []
    for port, info in ports_info.items():
        status = info['status']
        in_use = info['in_use']
        should_free = info['should_be_free']
        desc = info['description']
        
        if should_free and in_use:
            result(f'Port {port}', 'warn', f"{desc} - ZAJETY (powinien byc wolny!)")
            port_issues.append(port)
        elif not should_free and in_use:
            result(f'Port {port}', 'ok', f"{desc} - usluga dziala")
        else:
            result(f'Port {port}', 'info', f"{desc} - wolny")
    
    if port_issues:
        report['checks']['ports'] = {'status': 'warn', 'issues': port_issues}
    else:
        report['checks']['ports'] = {'status': 'ok', 'issues': []}
    
    # ===== DRUKARKI I CZYTNIKI =====
    header("DRUKARKI I CZYTNIKI")
    
    com_ports = get_com_ports()
    report['printers']['com_ports'] = com_ports
    if com_ports:
        result('Porty COM', 'found', f"Znaleziono {len(com_ports)}")
        for p in com_ports:
            safe_print(f"      - {p['port']}: {p['description']}")
    else:
        result('Porty COM', 'info', "Nie wykryto (czytniki kart moga nie dzialac)")
    
    win_printers = get_windows_printers()
    report['printers']['windows'] = win_printers
    if win_printers:
        result('Drukarki Windows', 'found', f"Znaleziono {len(win_printers)}")
        for p in win_printers[:5]:
            safe_print(f"      - {p['name']} @ {p['port']}")
        if len(win_printers) > 5:
            safe_print(f"      ... i {len(win_printers) - 5} wiecej")
    else:
        result('Drukarki Windows', 'info', "Brak zainstalowanych drukarek")
    
    net_printers = scan_network_printers()
    report['printers']['network'] = net_printers
    if net_printers:
        result('Drukarki sieciowe', 'found', f"Znaleziono {len(net_printers)}")
        for p in net_printers:
            safe_print(f"      - {p['full_address']} ({p['type']})")
    else:
        result('Drukarki sieciowe', 'info', "Nie wykryto w sieci lokalnej")
    
    # ===== BISTRO SIMPLEX =====
    header("WYKRYWANIE BISTRO SIMPLEX")
    
    bistro_paths = find_bistro_installations()
    if bistro_paths:
        result('Instalacje', 'found', f"Znaleziono {len(bistro_paths)}")
        
        for bpath in bistro_paths:
            safe_print(f"\n  --- {bpath} ---")
            bistro_info = analyze_bistro(bpath)
            report['bistro'].append(bistro_info)
            
            if bistro_info.get('version'):
                result('Wersja', 'info', bistro_info['version'])
            result('Rozmiar', 'info', f"{bistro_info['size_mb']} MB")
            
            if bistro_info['config_files']:
                result('Konfiguracja', 'info', ', '.join(bistro_info['config_files'][:3]))
            
            if bistro_info['data_files']:
                data_summary = ', '.join([f"{ext}: {cnt}" for ext, cnt in list(bistro_info['data_files'].items())[:4]])
                result('Pliki danych', 'info', data_summary)
            
            if bistro_info['printers']:
                result('Drukarki', 'found', f"{len(bistro_info['printers'])} skonfigurowanych")
                for pr in bistro_info['printers'][:3]:
                    addr = pr.get('address') or pr.get('port') or '-'
                    safe_print(f"      - {pr['name']}: {pr.get('type', '?')} @ {addr}")
            
            if bistro_info['operators']:
                result('Operatorzy', 'found', f"{len(bistro_info['operators'])}")
                for op in bistro_info['operators'][:3]:
                    safe_print(f"      - {op['name']} ({op.get('role', '-')})")
    else:
        result('Instalacje', 'info', "Nie wykryto Bistro Simplex")
    
    # ===== REKOMENDACJE =====
    header("REKOMENDACJE")
    
    recs = []
    
    # Krytyczne
    if report['checks']['mysql']['status'] == 'fail':
        recs.append(('fail', "KRYTYCZNE: Zainstaluj MySQL/MariaDB - https://mariadb.org/download/"))
    
    if report['checks']['nodejs']['status'] == 'fail':
        recs.append(('fail', "KRYTYCZNE: Zainstaluj Node.js 18+ - https://nodejs.org"))
    
    if report['checks']['disk']['status'] == 'fail':
        recs.append(('fail', f"KRYTYCZNE: Za malo miejsca na dysku (min {MIN_DISK_GB} GB)"))
    
    if report['checks']['memory']['status'] == 'fail':
        recs.append(('fail', f"KRYTYCZNE: Za malo RAM (min {MIN_RAM_GB} GB)"))
    
    # Ostrzeżenia
    if report['checks'].get('ports', {}).get('issues'):
        recs.append(('warn', f"Porty {report['checks']['ports']['issues']} sa zajete - zwolnij przed instalacja"))
    
    if report['checks']['redis']['status'] != 'ok':
        recs.append(('warn', "Zainstaluj Redis dla lepszej wydajnosci - https://redis.io"))
    
    if report['checks']['git']['status'] != 'ok':
        recs.append(('warn', "Zainstaluj Git - https://git-scm.com"))
    
    if report['checks'].get('firewall', {}).get('enabled'):
        recs.append(('warn', "Firewall wlaczony - dodaj wyjatki dla portow 3000, 3001, 3306"))
    
    if not is_admin():
        recs.append(('warn', "Uruchom skaner jako Administrator dla pelnych wynikow"))
    
    # Info
    if report['bistro']:
        recs.append(('info', f"Wykryto {len(report['bistro'])} instalacji Bistro - mozliwa migracja danych"))
    
    # Wyświetl rekomendacje
    if recs:
        for status, text in recs:
            result('', status, text)
            report['recommendations'].append(text)
    else:
        result('System gotowy', 'ok', "Wszystkie wymagania spelnione!")
    
    return report

# ============================================================
# ZAPISYWANIE I WYSYŁANIE
# ============================================================

def save_report(report: Dict[str, Any]) -> str:
    """Zapisuje raport do pliku JSON."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    hostname = report['meta']['hostname'].replace(' ', '_')
    filename = f"pos_scan_{hostname}_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    return filename

def send_report(report: Dict[str, Any], server_url: str) -> Tuple[bool, str]:
    """Wysyła raport do serwera POS Karczma."""
    try:
        url = server_url.rstrip('/') + '/api/tools/scanner/reports'
        data = json.dumps(report, default=str).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('User-Agent', f'POS-Scanner/{VERSION}')
        
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('success'):
                return True, "Raport wyslany pomyslnie!"
            return False, result.get('error', 'Nieznany blad serwera')
    except urllib.error.URLError as e:
        return False, f"Blad polaczenia: {e.reason}"
    except urllib.error.HTTPError as e:
        return False, f"Blad HTTP {e.code}: {e.reason}"
    except Exception as e:
        return False, f"Blad: {e}"

# ============================================================
# MAIN
# ============================================================

def main():
    safe_print("\n" + col("=" * 70, Colors.BOLD))
    safe_print(col(f"  POS KARCZMA - SKANER SRODOWISKOWY v{VERSION}", Colors.BOLD))
    safe_print(col("=" * 70, Colors.BOLD))
    safe_print(f"  Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    safe_print(f"  System: {platform.system()} {platform.release()} ({platform.machine()})")
    safe_print(f"  Uruchomiono jako: {'Administrator' if is_admin() else 'Uzytkownik'}")
    
    # Generuj raport
    report = generate_report()
    
    # Zapisz lokalnie
    header("ZAPISYWANIE")
    filename = save_report(report)
    result('Raport lokalny', 'ok', filename)
    
    # Wysyłanie do serwera
    header("WYSYLANIE DO SERWERA")
    
    # Użyj wbudowanego adresu lub zapytaj
    if POS_SERVER_URL:
        server = POS_SERVER_URL
        safe_print(f"  Adres serwera: {server} (wbudowany)")
    else:
        safe_print("  Raport mozna wyslac do serwera POS Karczma.")
        safe_print("  (Pobierz skaner z POS Karczma zeby wysylal automatycznie)\n")
        try:
            server = input("  Adres serwera POS (ENTER = pomin): ").strip()
        except (EOFError, KeyboardInterrupt):
            server = ""
    
    if server:
        if not server.startswith('http'):
            server = 'http://' + server
        safe_print(f"  Wysylam do: {server}...")
        
        success, msg = send_report(report, server)
        if success:
            result('Wyslano', 'ok', msg)
        else:
            result('Blad', 'warn', msg)
            safe_print("  Raport lokalny zostal zapisany - mozesz wyslac recznie.")
    else:
        result('Pominieto', 'info', "Raport nie zostal wyslany")
    
    # Podsumowanie
    safe_print("\n" + col("=" * 70, Colors.BOLD))
    
    criticals = sum(1 for c in report['checks'].values() if isinstance(c, dict) and c.get('status') == 'fail')
    warnings = sum(1 for c in report['checks'].values() if isinstance(c, dict) and c.get('status') == 'warn')
    
    if criticals:
        safe_print(col(f"  [X] {criticals} KRYTYCZNYCH PROBLEMOW - napraw przed instalacja!", Colors.FAIL))
    elif warnings:
        safe_print(col(f"  [!] {warnings} ostrzezen - system moze dzialac", Colors.WARN))
    else:
        safe_print(col("  [OK] System gotowy do instalacji POS Karczma!", Colors.OK))
    
    if report['bistro']:
        safe_print(col(f"  [*] Wykryto {len(report['bistro'])} instalacji Bistro Simplex", Colors.INFO))
    
    safe_print(col("=" * 70, Colors.BOLD) + "\n")
    
    return 0 if criticals == 0 else 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        safe_print("\n\nPrzerwano.")
        sys.exit(130)
    except Exception as e:
        safe_print(f"\n\nBlad krytyczny: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
