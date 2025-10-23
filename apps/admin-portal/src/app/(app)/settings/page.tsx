const access = [
  { name: 'Alice Rivera', role: 'Admin', lastActive: '2 minutes ago' },
  { name: 'Marco Chen', role: 'Compliance', lastActive: '11 minutes ago' },
  { name: 'Priya Patel', role: 'Support', lastActive: '1 hour ago' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform Settings & Access Control</h2>
        <p className="text-sm text-muted-foreground">
          Manage internal roles, API credentials, and audit requirements for the NinjaPay ops perimeter.
        </p>
      </div>
      <section className="rounded-2xl border border-border/60 bg-card/70 p-6">
        <h3 className="text-sm font-semibold">Team Directory</h3>
        <p className="text-xs text-muted-foreground">Track who has access to what, and when they were active.</p>
        <div className="mt-4 divide-y divide-border/40 text-sm">
          {access.map((member) => (
            <div key={member.name} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <p className="text-xs text-muted-foreground">{member.lastActive}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        Next steps: connect to admin directory, enable on-call overrides, and expose audit-log search powered by the
        logging pipeline.
      </section>
    </div>
  );
}

