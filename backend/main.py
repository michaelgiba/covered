import sys
import os

# Ensure backend package is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from covered.main import main

if __name__ == "__main__":
    main()
