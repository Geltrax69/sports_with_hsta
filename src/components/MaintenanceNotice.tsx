// MaintenanceNotice component for displaying 'Under Maintenance' messages.

interface MaintenanceNoticeProps {
    title?: string;
    message?: string;
    icon?: string;
}

export function MaintenanceNotice({
    title = "Under Maintenance",
    message = "This section is currently being updated to provide you with a better experience. Please check back soon.",
    icon = "construction"
}: MaintenanceNoticeProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl my-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-yellow-600 animate-pulse">
                    {icon}
                </span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {message}
            </p>
            <div className="mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    Coming Soon
                </div>
            </div>
        </div>
    );
}
