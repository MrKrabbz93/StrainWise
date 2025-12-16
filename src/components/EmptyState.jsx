import React from 'react';

const EmptyState = ({ type }) => {
    const emptyStates = {
        favorites: {
            title: "No favorite strains yet.",
            description: "Start exploring strains and add your favorites to see them here.",
            actionText: "Explore Strains",
            actionUrl: "/strains"
        },
        bio: {
            title: "No bio yet.",
            description: "Tell the community about your cannabis journey.",
            actionText: "Edit Profile",
            actionUrl: "/profile"
        },
        community: {
            title: "No community activity yet.",
            description: "Be the first to share your experience with the community.",
            actionText: "Share Experience",
            actionUrl: "/community"
        }
    };

    const state = emptyStates[type] || emptyStates.favorites;

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{state.title}</h3>
            <p className="text-gray-400 mb-6 max-w-md">{state.description}</p>
            <a
                href={state.actionUrl}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                {state.actionText}
            </a>
        </div>
    );
};

export default EmptyState;
