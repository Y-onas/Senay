import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-burgundy px-4 pt-20 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-yellow-brand">404</p>
        <h1 className="heading-display mt-4 text-3xl uppercase text-white sm:text-4xl">
          This page wandered off
        </h1>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          The page you&apos;re looking for doesn&apos;t exist — but there&apos;s
          plenty of good food waiting back home.
        </p>
        <Link to="/" className="btn-primary-light mt-8">
          Back to home
        </Link>
      </div>
    </section>
  )
}
