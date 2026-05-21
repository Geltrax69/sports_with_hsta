import { Link } from 'react-router-dom'

export function MediaManagement() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Media</h1>
      <p className="text-gray-600 mb-4">Manage gallery images and YouTube videos for the public site.</p>
      <Link
        to="/media"
        className="inline-block mb-8 px-5 py-2.5 rounded-lg border-2 border-[#5a0a8f] text-[#5a0a8f] font-bold hover:bg-purple-50 bg-white"
      >
        View All (public Media page)
      </Link>
      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          to="/admin/media/gallery"
          className="block p-8 rounded-2xl border-2 border-[#5a0a8f]/20 bg-white hover:border-[#5a0a8f] hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-[#5a0a8f] mb-3">photo_library</span>
          <h2 className="text-xl font-black text-gray-900">Gallery Images</h2>
          <p className="text-gray-600 mt-2 text-sm">Upload and manage featured gallery photos.</p>
        </Link>
        <Link
          to="/admin/media/videos"
          className="block p-8 rounded-2xl border-2 border-[#5a0a8f]/20 bg-white hover:border-[#5a0a8f] hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-[#5a0a8f] mb-3">play_circle</span>
          <h2 className="text-xl font-black text-gray-900">Videos</h2>
          <p className="text-gray-600 mt-2 text-sm">Add YouTube links with titles for the Videos tab.</p>
        </Link>
      </div>
    </div>
  )
}
