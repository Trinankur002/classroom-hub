import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Paperclip, 
  Smile,
  Users,
  MessageCircle,
  Search,
  Phone,
  Video,
  MoreVertical,
  Hash,
  AtSign
} from "lucide-react";
import { useChatStore, useClassroomStore, useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";

export default function Chat() {
  const { messages, addMessage, getMessagesForClassroom } = useChatStore();
  const { classrooms } = useClassroomStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [chatType, setChatType] = useState<'student' | 'class'>('class');
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || '';
  const userRole = user?.role || 'student';

  // Get classrooms user is part of
  const userClassrooms = userRole === 'teacher' 
    ? classrooms.filter(c => c.teacherId === userId)
    : classrooms.filter(c => c.students.includes(userId));

  // Get messages for selected classroom and chat type
  const classroomMessages = selectedClassroom 
    ? getMessagesForClassroom(selectedClassroom, chatType)
    : [];

  // Filter messages by search term
  const filteredMessages = classroomMessages.filter(msg =>
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  // Auto-select first classroom
  useEffect(() => {
    if (userClassrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(userClassrooms[0].id);
    }
  }, [userClassrooms, selectedClassroom]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedClassroom) return;

    const message = {
      id: Date.now().toString(),
      content: messageInput,
      senderId: userId,
      senderName: user?.name || 'Unknown',
      senderRole: userRole,
      chatType,
      classroomId: selectedClassroom,
      timestamp: new Date(),
      mentions: extractMentions(messageInput),
    };

    addMessage(message);
    setMessageInput("");
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the chat.",
    });
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const selectedClassroomData = classrooms.find(c => c.id === selectedClassroom);

  return (
    <div className="p-6 h-[calc(100vh-6rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 space-y-4">
        {/* Classroom Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Classrooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger>
                <SelectValue placeholder="Select classroom" />
              </SelectTrigger>
              <SelectContent>
                {userClassrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedClassroom && (
              <div className="flex gap-2">
                <Button
                  variant={chatType === 'class' ? 'default' : 'outline-solid'}
                  size="sm"
                  onClick={() => setChatType('class')}
                  className="flex-1 gap-1"
                >
                  <Hash className="h-3 w-3" />
                  Class Chat
                </Button>
                {userRole === 'student' && (
                  <Button
                    variant={chatType === 'student' ? 'default' : 'outline-solid'}
                    size="sm"
                    onClick={() => setChatType('student')}
                    className="flex-1 gap-1"
                  >
                    <Users className="h-3 w-3" />
                    Students
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Members */}
        {selectedClassroomData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({selectedClassroomData.students.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Teacher */}
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-teacher text-white">
                    {selectedClassroomData.teacherName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedClassroomData.teacherName}</p>
                  <Badge variant="secondary" className="text-xs">Teacher</Badge>
                </div>
                <div className="h-2 w-2 bg-accent rounded-full"></div>
              </div>
              
              <Separator />
              
              {/* Students */}
              {selectedClassroomData.students.slice(0, 8).map((studentId, index) => (
                <div key={studentId} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-student text-white">
                      S{index + 1}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Student {index + 1}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                  <div className="h-2 w-2 bg-accent rounded-full"></div>
                </div>
              ))}
              
              {selectedClassroomData.students.length > 8 && (
                <p className="text-xs text-muted-foreground px-2">
                  +{selectedClassroomData.students.length - 8} more
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Chat */}
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {chatType === 'class' ? (
                  <Hash className="h-5 w-5 text-primary" />
                ) : (
                  <Users className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {chatType === 'class' ? 'Class Chat' : 'Student Chat'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedClassroomData?.name || 'Select a classroom'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            {!selectedClassroom ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">Select a Classroom</h3>
                  <p className="text-sm text-muted-foreground">Choose a classroom to start chatting</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No messages match your search' : 'Be the first to send a message!'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.senderId === userId ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs ${
                        message.senderRole === 'teacher' 
                          ? 'bg-teacher text-white' 
                          : 'bg-student text-white'
                      }`}>
                        {message.senderName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 max-w-xs ${
                      message.senderId === userId ? 'text-right' : ''
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{message.senderName}</span>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {message.senderRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(new Date(message.timestamp))}
                        </span>
                      </div>
                      
                      <div className={`rounded-lg p-3 ${
                        message.senderId === userId
                          ? 'bg-primary text-primary-foreground'
                          : message.senderRole === 'teacher'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      
                      {message.mentions && message.mentions.length > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AtSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            mentioned {message.mentions.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        {selectedClassroom && (
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Input
                placeholder={`Message ${chatType === 'class' ? 'class' : 'students'}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-2">
              Use @username to mention someone • Shift+Enter for new line
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}