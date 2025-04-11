# Passport Management Frontend

This is the web interface for the passport management system.

## Development

To run the development server:

```bash
npm install
npm run dev
```

## Building for Production

To build the application for production:

```bash
npm install
npm run build
```

This will generate a `dist` directory with the production build.

## Deployment to Render.com

This project can be easily deployed to Render.com using the provided `render.yaml` file. 

### Steps:

1. Push your changes to GitHub
2. Go to [Render.com Dashboard](https://dashboard.render.com/)
3. Click "New" and select "Blueprint"
4. Connect your GitHub repository
5. Select the repository and click "Apply Blueprint"
6. Render will automatically detect the `render.yaml` file and set up the service

### Manual Deployment

If you prefer to set up the service manually:

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Static Site"
3. Connect your GitHub repository
4. Enter the following settings:
   - Name: passport-management-frontend
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
5. Click "Create Static Site"

## Environment Variables

No additional environment variables are needed as the backend URL is hardcoded in the application.
