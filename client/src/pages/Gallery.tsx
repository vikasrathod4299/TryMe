import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2 } from "lucide-react";

const Gallery = () => {
  // Mock data for generated images
  const mockImages = [
    {
      id: 1,
      url: "/placeholder.svg",
      title: "Summer Dress Try-On",
      date: "2024-01-15",
      likes: 24,
    },
    {
      id: 2,
      url: "/placeholder.svg", 
      title: "Casual Blazer Look",
      date: "2024-01-14",
      likes: 18,
    },
    {
      id: 3,
      url: "/placeholder.svg",
      title: "Evening Gown Style",
      date: "2024-01-13", 
      likes: 32,
    },
    {
      id: 4,
      url: "/placeholder.svg",
      title: "Street Style Outfit",
      date: "2024-01-12",
      likes: 15,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Your Gallery
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse through your AI-generated virtual try-on results and share your favorite looks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockImages.map((image) => (
            <Card key={image.id} className="bg-gradient-card border border-white/10 backdrop-blur-sm overflow-hidden group hover:shadow-elegant transition-all duration-500">
              <CardContent className="p-0">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 truncate">
                    {image.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {image.date}
                    </Badge>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{image.likes}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockImages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating virtual try-on images to build your gallery!
            </p>
            <Button asChild>
              <a href="/">Create Your First Look</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;