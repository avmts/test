from playwright.sync_api import sync_playwright
import os

def verify_game_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get absolute path
        cwd = os.getcwd()
        file_path = f"file://{cwd}/index.html"
        print(f"Navigating to {file_path}")

        # Load the index.html directly from the file system
        page.goto(file_path)

        # Wait for the canvas to be present
        page.wait_for_selector("#gameCanvas")

        # Wait a bit for the game to initialize and render frames
        page.wait_for_timeout(2000)

        # Take a screenshot
        page.screenshot(path="verification/game_render.png")

        browser.close()

if __name__ == "__main__":
    verify_game_render()
