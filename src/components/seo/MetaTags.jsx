import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({
    title = 'StrainWise - AI Cannabis Consultant',
    description = 'Your personal AI sommelier for cannabis strains. Discover, track, and learn.',
    image = '/og-image.jpg',
    url = 'https://strainwise.app'
}) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default MetaTags;
