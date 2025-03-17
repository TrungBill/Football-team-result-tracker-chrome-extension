# Football Scores Monitor Chrome Extension

## Overview

Football Scores Monitor is a Chrome extension that displays football scores, fixtures, and league standings in a popup. Users can select their favorite team and league to get the latest updates.

## Features

- Displays past results and upcoming fixtures for the selected team.
- Shows the current league standings.
- Allows users to select their favorite team and league.
- Periodically fetches data to keep the information up-to-date.

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
