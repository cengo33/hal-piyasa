#!/usr/bin/env python3
import os
import sys
import argparse
import requests
from datetime import datetime

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

# Reconfigure stdout/stderr to use UTF-8 on Windows to prevent encoding errors
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def read_whatsapp_replies(target_phone):
    api_key = load_zernio_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 1. Fetch phone numbers to discover sandbox account ID
    url_numbers = "https://api.zernio.com/v1/whatsapp/phone-numbers"
    res_numbers = requests.get(url_numbers, headers=headers)
    if res_numbers.status_code != 200:
        print(f"[ERROR] Failed to fetch phone numbers: {res_numbers.text}")
        return False
        
    data_numbers = res_numbers.json()
    sandbox = data_numbers.get("sandbox")
    if not sandbox:
        print("[ERROR] Sandbox details not found in API response.")
        return False
        
    account_id = sandbox.get("accountId")
    target_phone = target_phone.strip().replace("+", "")
    
    # 2. Get all conversations to locate the correct conversationId
    url_convs = "https://api.zernio.com/v1/inbox/conversations?platform=whatsapp"
    res_convs = requests.get(url_convs, headers=headers)
    if res_convs.status_code != 200:
        print(f"[ERROR] Failed to fetch conversations: {res_convs.text}")
        return False
        
    convs_data = res_convs.json().get("data", [])
    conversation_id = None
    for conv in convs_data:
        # Check if the conversation matches the participant
        if conv.get("participantId") == target_phone or conv.get("participantUsername") == target_phone or conv.get("id") == target_phone:
            conversation_id = conv.get("id")
            break
            
    if not conversation_id:
        # Fallback to direct phone if no conversation was fetched in list
        print(f"[WARNING] Conversation ID not found in list, using phone number '{target_phone}' as fallback.")
        conversation_id = target_phone
        
    # 3. Retrieve messages for this conversationId
    url_messages = f"https://api.zernio.com/v1/inbox/conversations/{conversation_id}/messages?accountId={account_id}&limit=50&sortOrder=asc"
    res_messages = requests.get(url_messages, headers=headers)
    
    if res_messages.status_code == 400 and "accountId" in res_messages.text:
        # Try alternate query param or fallback
        url_messages = f"https://api.zernio.com/v1/inbox/conversations/{target_phone}/messages?accountId={account_id}&limit=50&sortOrder=asc"
        res_messages = requests.get(url_messages, headers=headers)

    if res_messages.status_code != 200:
        print(f"[ERROR] Failed to fetch messages: {res_messages.text}")
        return False
        
    messages_data = res_messages.json().get("messages", [])
    if not messages_data:
        print(f"[INFO] No messages found in conversation with +{target_phone}.")
        return True
        
    print("\n" + "="*50)
    print(f"💬 CONVERSATION HISTORY WITH +{target_phone}")
    print("="*50)
    
    for msg in messages_data:
        direction = msg.get("direction", "unknown").upper()
        sender_name = msg.get("senderName", "Unknown")
        text = msg.get("message", "")
        created_at_raw = msg.get("createdAt", "")
        
        # Parse time nicely
        try:
            dt = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
            time_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            time_str = created_at_raw
            
        direction_label = "[INCOMING]" if direction == "INCOMING" else "[OUTGOING]"
        print(f"\n{direction_label} {time_str} | From: {sender_name}")
        print(f"  {text}")
        
    print("\n" + "="*50 + "\n")
    return True

def main():
    parser = argparse.ArgumentParser(description="Read WhatsApp Sandbox replies from Zernio")
    parser.add_argument("-t", "--to", required=True, help="Target phone number in E164 format (e.g. +905076231510)")
    
    args = parser.parse_args()
    read_whatsapp_replies(args.to)

if __name__ == "__main__":
    main()
