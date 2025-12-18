import RouteSetter from '@/components/RouteSetter';

export default function HistoryPage() {
    return <RouteSetter viewId="history" />; // Note: history viewId wasn't explicit in MainApp, might default to overview or need adding? MainApp doesn't show history page logic?
    // Checking MainApp.tsx... I don't see specific History page logic in renderContent(). 
    // It might be a modal (GenerationHistoryPanel is likely a modal or sidebar extension).
    // Sidebar says `href: '/history'`? Let's check Sidebar.tsx again.
    // Sidebar.tsx line 163: href: '/history' -> setActivePage('history').
    // MainApp renderContent() doesn't seem to handle 'history'. 
    // It might be handled by state?
    // Wait, Sidebar triggers `handleOpenHistoryPanel`? No, it just sets activePage to 'history'.
    // If 'history' viewId isn't handled in MainApp's renderContent, it will show NotFound.
    // I should check if History is a page or a modal.
    // Assuming page based on href.
}
