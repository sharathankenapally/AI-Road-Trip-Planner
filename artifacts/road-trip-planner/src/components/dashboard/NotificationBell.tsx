import { Bell } from 'lucide-react';
import { useTripStore } from '@/store/use-trip-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const { notifications, markNotificationsRead } = useTripStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open && unreadCount > 0) {
        markNotificationsRead();
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="px-4 py-3 flex flex-col items-start gap-1 cursor-default">
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm ${notif.read ? 'text-muted-foreground' : 'font-medium'}`}>
                    {notif.message}
                  </span>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{notif.time}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
