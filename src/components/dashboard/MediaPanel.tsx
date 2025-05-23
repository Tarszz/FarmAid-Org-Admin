
import { Card } from "@/components/ui/card";

interface Media {
  id: string;
  title: string;
  date: string;
  url: string;
}

const MediaPanel = () => {
  // Sample data for media
  const sampleMedia = [
    { id: "MED-001", title: "Farm Aid Distribution Day", date: "Apr 22, 2025", url: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&q=80&w=1770&ixlib=rb-4.0.3" },
    { id: "MED-002", title: "Farmer Training Workshop", date: "Apr 18, 2025", url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=1770&ixlib=rb-4.0.3" },
    { id: "MED-003", title: "New Equipment Delivery", date: "Apr 15, 2025", url: "https://images.unsplash.com/photo-1598599136938-b149c32014ea?auto=format&fit=crop&q=80&w=1771&ixlib=rb-4.0.3" },
    { id: "MED-004", title: "Community Garden Project", date: "Apr 12, 2025", url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1770&ixlib=rb-4.0.3" },
  ];

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Media Upload</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleMedia.map((media) => (
          <div key={media.id} className="p-4 border rounded-lg border-gray-200 bg-white">
            <img 
              src={media.url} 
              alt={media.title}
              className="w-full h-48 object-cover rounded-lg mb-2"
            />
            <h3 className="font-semibold text-gray-800">{media.title}</h3>
            <p className="text-sm text-gray-700">Date: {media.date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MediaPanel;
