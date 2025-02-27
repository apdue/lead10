# Facebook Lead Forms Manager

A Next.js application for managing Facebook Lead Forms, including token conversion, form listing, and lead downloading capabilities.

## Features

- Automatic conversion of short-lived token to long-lived token
- Retrieval of non-expiring Page Access Token
- Automatic fetching of lead forms for the Page
- List and select forms in a user-friendly interface
- Download all leads or only yesterday's leads in CSV format
- Real-time status updates and error handling
- Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js 18.x or later
- A Facebook App with the following:
  - Lead Ads permissions
  - Valid App ID and App Secret
  - A short-lived user access token with `leads_retrieval` and `pages_show_list` permissions

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd girdhari-lead-grok
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root with your Facebook credentials:
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   FACEBOOK_SHORT_LIVED_TOKEN=your_short_lived_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. When you first open the application, it will automatically:
   - Convert your short-lived token to a long-lived token
   - Get a non-expiring Page Access Token
   - Fetch available lead forms

2. Select a form from the dropdown menu to work with.

3. Use the buttons to:
   - Download all leads for the selected form
   - Download only yesterday's leads

4. The application will show real-time status updates and any errors that occur.

## Environment Variables

- `FACEBOOK_APP_ID`: Your Facebook App ID
- `FACEBOOK_APP_SECRET`: Your Facebook App Secret
- `FACEBOOK_SHORT_LIVED_TOKEN`: A short-lived user access token with required permissions

## Getting Facebook Credentials

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Enable Lead Ads permissions
3. Get your App ID and App Secret from the app settings
4. Generate a short-lived user access token with `leads_retrieval` and `pages_show_list` permissions

## Security Notes

- Never commit your `.env.local` file
- Keep your App Secret and tokens secure
- Regularly monitor your app's usage
- Consider implementing additional security measures for production use

## Error Handling

The application includes comprehensive error handling for:
- Missing or invalid credentials
- Failed token conversions
- Network errors
- Permission issues
- Invalid form IDs

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 