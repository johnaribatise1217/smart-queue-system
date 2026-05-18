/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com", "res.cloudinary.com", "cdn.pixabay.com"],
    remotePatterns: [new URL("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png")]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: { ignoreDuringBuilds: true },
};

export default config;
