# Word Scoring Application

## About the Project

This application is a web application that allows users to play a word game and save their scores. Users can match words, earn points, and be ranked on the leaderboard.

## Installation

1. Upload all files to your web server.
2. Make sure your web server has PHP support.
3. If necessary, configure the database settings in the relevant files in the `api` folder.

## Starting the Server

For local development, you can use PHP's built-in web server:

```bash
# Navigate to your project directory
cd path/to/project

# Start the PHP server on port 8080
php -S 127.0.0.1:8080
```

After starting the server, you can access the application by opening http://127.0.0.1:8080 in your web browser.

## Usage

1. Open the `index.html` file from your browser.
2. Enter your username and start the game.
3. Match the given words and earn points.
4. Your score will be saved at the end of the game.
5. You can view the rankings and compare with other users.

## File Structure

- `index.html` - Main application interface
- `script.js` - Client-side code of the application
- `api/` - Server-side API endpoints
  - `get-keywords.php` - API to get words
  - `get-scores.php` - API to get all scores
  - `get-user-rankings.php` - API to get user rankings
  - `save-score.php` - API to save user scores
  - `sample-scores.json` - JSON file for sample scores

## API Endpoints

### 1. Getting Word List 