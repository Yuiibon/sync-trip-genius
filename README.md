# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Google Maps when running locally

Create a local `.env.local` file (do not commit it) and add your browser-restricted Maps key:

```sh
VITE_GOOGLE_MAPS_API_KEY="your-browser-key"
```

Enable **Maps JavaScript API** for that key and allow both `http://localhost:8080/*` and
`http://127.0.0.1:8080/*` in its HTTP referrer restrictions. Google Maps search and directions
buttons use official Maps URLs and do not require a key; the key is only needed for the embedded map.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
