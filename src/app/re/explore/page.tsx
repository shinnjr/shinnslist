import type { Metadata } from 'next';
import ExploreMap from './ExploreMap';

export const metadata: Metadata = {
  title: 'Target from space — corridor parcel explorer | Shinnslist',
  description:
    'Dive from orbit to the Front Range corridor, pick who you target, and see every scored matching parcel on the map. 227K parcels, free preview.',
};

export default function ExplorePage() {
  return <ExploreMap />;
}
