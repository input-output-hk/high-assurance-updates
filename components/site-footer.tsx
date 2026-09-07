import { getConfig, getStatusAsOf } from "@/lib/content";

export function SiteFooter() {
    const config = getConfig();
    const asOf = getStatusAsOf();

    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
                <p>
                    {config.site.title} · Input Output
                </p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
                    {asOf && <span>status as of {asOf}</span>}
                    <a
                        href={`${config.site.url.replace(/\/+$/, "")}/llms.txt`}
                        className="text-[color:var(--on-primary-link)] hover:underline"
                    >
                        llms.txt
                    </a>
                    <a
                        href={config.site.repoUrl}
                        className="text-[color:var(--on-primary-link)] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        source
                    </a>
                </p>
            </div>
        </footer>
    );
}
