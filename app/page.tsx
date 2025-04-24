import HabitTracker from "@/components/habit-tracker"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HabitTracker />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `,
        }}
      />
    </main>
  )
}

