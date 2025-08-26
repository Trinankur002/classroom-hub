import { FileText, Image as ImageIcon } from "lucide-react";

interface FilePreviewProps {
    files: { url: string; name: string; mimetype: string }[];
}

export default function FilePreview({ files }: FilePreviewProps) {
    if (!files || files.length === 0) return null;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
            {files.map((file, index) => (
                <div
                    key={index}
                    className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col"
                >
                    {/* Preview */}
                    <div className="h-24 w-full flex items-center justify-center bg-muted">
                        {file.mimetype.startsWith("image/") ? (
                            <img
                                src={file.url}
                                alt={file.name}
                                className="object-cover h-full w-full"
                            />
                        ) : file.mimetype === "application/pdf" ? (
                            <iframe
                                src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                title={file.name}
                                className="w-full h-full"
                            />
                        ) : (
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="px-2 py-1 flex items-center justify-between">
                        <p className="text-xs truncate max-w-[70%]">{file.name}</p>
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                        >
                            Open
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
}
