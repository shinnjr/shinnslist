#!/usr/bin/env python3
"""Throwaway probe: what's actually reachable from this machine right now."""
import sys, time, json
sys.path.insert(0, "/Users/jamesshinn/projects/freebie/scripts")

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36")

def probe_fb(p):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA, viewport={"width":1440,"height":900},
                              locale="en-US", timezone_id="America/Denver")
    Stealth().apply_stealth_sync(ctx)
    page = ctx.new_page()
    url = "https://www.facebook.com/marketplace/denver/"
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(6000)
        final = page.url
        title = page.title()
        html = page.content()
        low = html.lower()
        markers = {
            "login_wall": ("log in" in low or "login" in low) and "marketplace/item" not in low,
            "has_marketplace_items": "/marketplace/item/" in low,
            "checkpoint": "checkpoint" in low,
            "error_400": ">error<" in low or "an error occurred" in low,
            "c_user_cookie": ctx.cookies(".facebook.com") and any(c["name"]=="c_user" for c in ctx.cookies()),
        }
        # count item links
        import re
        items = len(set(re.findall(r'/marketplace/item/\d+', html)))
        print(json.dumps({"source":"fb-anon","final_url":final[:120],"title":title[:80],
                          "markers":markers,"item_links":items,"html_len":len(html)}))
    except Exception as e:
        print(json.dumps({"source":"fb-anon","error":f"{type(e).__name__}: {str(e)[:200]}"}))
    browser.close()

def probe_google(p):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA, viewport={"width":1440,"height":900}, locale="en-US")
    Stealth().apply_stealth_sync(ctx)
    page = ctx.new_page()
    url = ("https://www.google.com/search?q=site%3Afacebook.com%2Fmarketplace+free+Denver&num=20")
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(5000)
        final = page.url
        html = page.content()
        low = html.lower()
        import re
        links = [a for a in re.findall(r'href="(https?://[^"]+)"', html) if "facebook.com" in a or "google.com/url" in a]
        markers = {
            "captcha": "unusual traffic" in low or "captcha" in low or "not a robot" in low,
            "consent": "consent" in low and "google" in low,
            "has_results": "marketplace" in low,
        }
        print(json.dumps({"source":"google","final_url":final[:120],"title":page.title()[:80],
                          "markers":markers,"fb_links":len(links),"html_len":len(html)}))
    except Exception as e:
        print(json.dumps({"source":"google","error":f"{type(e).__name__}: {str(e)[:200]}"}))
    browser.close()

def probe_ddg():
    import requests
    for base in ("https://html.duckduckgo.com/html/", "https://lite.duckduckgo.com/lite/"):
        try:
            r = requests.get(base, params={"q": 'site:facebook.com/marketplace free Denver'},
                             headers={"User-Agent": UA}, timeout=25)
            low = r.text.lower()
            has_results = "result__a" in low or "result-link" in low or "marketplace" in low
            print(json.dumps({"source":"ddg","base":base,"status":r.status_code,
                              "has_results":has_results,"len":len(r.text)}))
        except Exception as e:
            print(json.dumps({"source":"ddg","base":base,"error":f"{type(e).__name__}: {str(e)[:150]}"}))

def probe_bing(p):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(user_agent=UA, viewport={"width":1440,"height":900}, locale="en-US")
    Stealth().apply_stealth_sync(ctx)
    page = ctx.new_page()
    url = "https://www.bing.com/search?q=site%3Afacebook.com%2Fmarketplace+free+Denver"
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(4000)
        html = page.content()
        low = html.lower()
        import re
        fb = len(set(re.findall(r'https?://[^"& ]*facebook\.com[^"& ]*', html)))
        print(json.dumps({"source":"bing","status":"ok","title":page.title()[:80],
                          "has_results":"b_algo" in low or "marketplace" in low,"fb_links":fb,"len":len(html)}))
    except Exception as e:
        print(json.dumps({"source":"bing","error":f"{type(e).__name__}: {str(e)[:150]}"}))
    browser.close()

with sync_playwright() as p:
    probe_fb(p)
    probe_google(p)
probe_ddg()
with sync_playwright() as p:
    probe_bing(p)
