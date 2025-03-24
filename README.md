#PitchPulse Chrome Extension

## Overview

PitchPulse is a Chrome extension that displays football scores, fixtures, and league standings in a popup. Users can select their favorite team and league to get the latest updates.

## Features

- Displays past results and upcoming fixtures for the selected team.
- Shows the current league standings.
- Allows users to select their favorite team and league.
- Periodically fetches data to keep the information up-to-date.

  <img width="390" alt="Screenshot 2025-03-20 at 4 54 41 pm" src="https://github.com/user-attachments/assets/99328d7b-ab80-44e7-bc70-8a216e463282" />
   <img width="388" alt="Screenshot 2025-03-20 at 4 55 00 pm" src="https://github.com/user-attachments/assets/85b1e3e3-c6e4-4050-af4e-78c26eb16187" />
   <img width="379" alt="Screenshot 2025-03-20 at 4 55 12 pm" src="https://github.com/user-attachments/assets/b8b9b046-7db3-4777-aeaa-b778a14932e3" />

## Technologies Used
### Frontend
- React - UI component library for the extension popup
- JavaScript/ES6+ - Core programming language
- CSS3 - Styling with modern CSS features
- Chrome Extension APIs - Browser integration and storage
- Vite - Build tool and development server
### Backend
- Node.js - JavaScript runtime for the server
- Express.js - Web server framework
- node-fetch - HTTP client for API requests
- dotenv - Environment variable management
- cors - Cross-Origin Resource Sharing middleware
- APIs and Data
- Football-Data.org API - Source for all football data
- Chrome Storage API - Local data persistence
### Development Tools
- npm - Package manager
- Git - Version control
- Chrome DevTools - Extension debugging
- ESLint - Code quality and style checking


## Installation

### Prerequisites

- Node.js and npm installed on your machine.

### Steps

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/football-scores-monitor.git
   cd football-scores-monitor
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Build the project:

   ```sh
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle in the top right corner.
   - Click "Load unpacked" and select the `dist` directory from the project.

## Usage

- Click on the extension icon to open the popup.
- Use the "Set Favourite" button to select your favorite team and league.
- The popup will display the latest scores, fixtures, and league standings for the selected team.

## Configuration

- The extension uses the Football Data API. You need to set your API key in the `.env` file:
  ```properties
  VITE_API_KEY=your_api_key_here
  ```

## Development

### Running in Development Mode

1. Start the development server:

   ```sh
   npm run dev
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle in the top right corner.
   - Click "Load unpacked" and select the `dist` directory from the project.

### Building for Production

1. Build the project:
   ```sh
   npm run build
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.


© 2025 Bill Nguyen. All rights reserved.
