import subprocess
import sys
import os
import time

def run_command():
    try:
        # Start the backend server
        print("Starting ChessLana backend server...")
        server_process = subprocess.Popen([
            "npx", "tsx", "server/index.ts"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Start the frontend client
        print("Starting ChessLana frontend client...")
        client_process = subprocess.Popen([
            "npx", "vite", "--host", "0.0.0.0", "--port", "5173"
        ])
        
        print("ChessLana is now running!")
        print("Backend API: http://localhost:3001")
        print("Frontend App: http://localhost:5173")
        
        # Keep both processes running
        try:
            client_process.wait()
        except KeyboardInterrupt:
            print("\nShutting down ChessLana...")
            server_process.terminate()
            client_process.terminate()
            
    except Exception as e:
        print(f"Error starting ChessLana: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_command()