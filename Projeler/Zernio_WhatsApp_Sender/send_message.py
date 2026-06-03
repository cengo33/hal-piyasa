#!/usr/bin/env python3
import os
import sys
import time
import argparse
import requests

# Reconfigure stdout/stderr to use UTF-8 on Windows to prevent encoding errors
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def load_zernio_key():
    # Attempt to load from env first
    api_key = os.getenv("ZERNIO_API_KEY")
    if api_key:
        return api_key
        
    # Fallback to local .env
    dot_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(dot_env):
        with open(dot_env, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("ZERNIO_API_KEY="):
                    return line.strip().split("=")[1]
                    
    # Fallback to master.env
    master_env = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "_knowledge", "credentials", "master.env"))
    if os.path.exists(master_env):
        with open(master_env, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("ZERNIO_API_KEY="):
                    return line.strip().split("=")[1]

    raise ValueError("[ERROR] ZERNIO_API_KEY not found in Environment, local .env, or master.env")

def make_request(method, url, headers, json_data=None, retries=3, backoff=2):
    """Robust HTTP requester with exponential backoff retry logic."""
    for attempt in range(retries):
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=json_data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            # If rate limited or server error, retry
            if response.status_code in [429, 500, 502, 503, 504]:
                print(f"[WARNING] API returned {response.status_code}. Retrying in {backoff}s... (Attempt {attempt+1}/{retries})")
                time.sleep(backoff)
                backoff *= 2
                continue
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"[WARNING] Connection error: {e}. Retrying in {backoff}s... (Attempt {attempt+1}/{retries})")
            time.sleep(backoff)
            backoff *= 2
            
    # Final try
    if method.upper() == "GET":
        return requests.get(url, headers=headers, timeout=10)
    else:
        return requests.post(url, headers=headers, json=json_data, timeout=10)

def send_whatsapp_message(to_number, message_text):
    api_key = load_zernio_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 1. Fetch phone numbers to discover sandbox account ID
    url_numbers = "https://api.zernio.com/v1/whatsapp/phone-numbers"
    print("[INFO] Fetching Zernio WhatsApp details...")
    res_numbers = make_request("GET", url_numbers, headers)
    if res_numbers.status_code != 200:
        print(f"[ERROR] Failed to fetch phone numbers: {res_numbers.text}")
        return False
        
    data_numbers = res_numbers.json()
    sandbox = data_numbers.get("sandbox")
    if not sandbox:
        print("[ERROR] Sandbox details not found in API response.")
        return False
        
    account_id = sandbox.get("accountId")
    template_name = sandbox.get("template", {}).get("name", "sandbox_start")
    template_lang = sandbox.get("template", {}).get("language", "en")
    
    # Format recipient number
    to_number = to_number.strip().replace("+", "")
    
    # 2. Check if a conversation is already active
    url_convs = f"https://api.zernio.com/v1/inbox/conversations?platform=whatsapp"
    res_convs = make_request("GET", url_convs, headers)
    conversation_exists = False
    
    if res_convs.status_code == 200:
        convs_data = res_convs.json().get("data", [])
        for conv in convs_data:
            if conv.get("participantId") == to_number or conv.get("id") == to_number:
                conversation_exists = True
                break

    # 3. Initiate/re-open conversation using the sandbox start template
    url_initiate = "https://api.zernio.com/v1/inbox/conversations"
    payload_initiate = {
        "accountId": account_id,
        "participantUsername": to_number,
        "templateName": template_name,
        "templateLanguage": template_lang
    }
    
    print(f"[INFO] Initiating conversation window with template '{template_name}' for {to_number}...")
    res_initiate = make_request("POST", url_initiate, headers, payload_initiate)
    
    if res_initiate.status_code not in [200, 201]:
        # Handle cases where the endpoint might return errors
        print(f"[ERROR] Failed to initiate conversation: {res_initiate.text}")
        return False
        
    initiate_data = res_initiate.json()
    conversation_id = initiate_data.get("data", {}).get("conversationId", to_number)
    
    # 4. Send the free-form text message
    url_send = f"https://api.zernio.com/v1/inbox/conversations/{conversation_id}/messages"
    payload_send = {
        "accountId": account_id,
        "message": message_text
    }
    
    print(f"[INFO] Sending freeform message to {to_number}...")
    res_send = make_request("POST", url_send, headers, payload_send)
    
    if res_send.status_code in [200, 201]:
        print(f"[SUCCESS] Message sent successfully to +{to_number}.")
        print(f"[INFO] Message ID: {res_send.json().get('data', {}).get('messageId')}")
        return True
    else:
        print(f"[ERROR] Failed to send message: {res_send.text}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Zernio WhatsApp Message Sender Utility")
    parser.add_argument("-t", "--to", required=True, help="Recipient phone number in E164 format (e.g., +905076231510)")
    parser.add_argument("-m", "--message", required=True, help="The message text to send")
    
    args = parser.parse_args()
    success = send_whatsapp_message(args.to, args.message)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
