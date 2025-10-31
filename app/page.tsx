import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-orange-50">
      <main className="flex flex-col items-center justify-center px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Nook
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Your cozy chat space 🏠
          </p>
        </div>

        <div className="max-w-2xl w-full space-y-6 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Nook
            </h2>
            <p className="text-gray-600 mb-6">
              A real-time chat application where friends and groups gather to chat in their own cozy spaces.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-teal-50 rounded-xl">
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="font-semibold text-gray-900 mb-2">Nooks</h3>
                <p className="text-sm text-gray-600">
                  Create and join group chats with up to 100 members
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Chat</h3>
                <p className="text-sm text-gray-600">
                  Instant messaging with typing indicators and read receipts
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">Friends</h3>
                <p className="text-sm text-gray-600">
                  Connect with friends and send direct messages
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl mb-2">🔔</div>
                <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
                <p className="text-sm text-gray-600">
                  Stay connected with push notifications
                </p>
              </div>
            </div>
          </div>



          <div className="text-center mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chatroom"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              🎨 Try Chat Room
            </Link>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
            >
              Get Started
            </Link>
            <a 
              href="https://github.com/your-username/nook"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
