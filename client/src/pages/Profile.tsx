import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Edit, Settings, Sparkles } from "lucide-react";

const Profile = () => {

  return (
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
                  Profile
                </h1>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info */}
                <Card className="lg:col-span-2 bg-gradient-card border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Edit className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input id="bio" placeholder="Tell us about yourself..." />
                    </div>
                    <Button className="w-full md:w-auto">Save Changes</Button>
                  </CardContent>
                </Card>

                {/* Profile Avatar & Stats */}
                <div className="space-y-6">
                  <Card className="bg-gradient-card border border-white/10 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src="/placeholder.svg" alt="Profile" />
                            <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                              JD
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <h3 className="font-semibold text-lg">John Doe</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          AI Fashion Enthusiast
                        </p>
                        <Badge variant="secondary" className="mb-4">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Pro Member
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Try-ons Created
                          </span>
                          <span className="font-semibold">24</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Gallery Items
                          </span>
                          <span className="font-semibold">18</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Member Since
                          </span>
                          <span className="font-semibold">Jan 2024</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-card border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Quick Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Privacy Settings
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Notification Preferences
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Account Security
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default Profile;
