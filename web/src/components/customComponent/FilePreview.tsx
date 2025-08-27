import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon } from "lucide-react";

interface FilePreviewProps {
    files: { url: string; name: string; mimetype: string }[];
    className?: string;
    previewClassName?: string;
    fileInfoClassName?: string;
}

export default function FilePreview({ files, className, previewClassName, fileInfoClassName }: FilePreviewProps) {
    if (!files || files.length === 0) return null;

    return (
        <div className={cn("grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-3", className)}>
            {files.map((file, index) => (
                <div
                    key={index}
                    className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col"
                >
                    <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        {/* Preview */}
                        <div className={cn("h-24 w-full flex items-center justify-center bg-muted", previewClassName)}>
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
                        <div className={cn("px-2 py-1 flex items-center justify-between", fileInfoClassName)}>
                            <p className="text-xs truncate max-w-[70%]">{file.name}</p>
                        </div>
                    </a>
                </div>
            ))}
        </div>
    );
}
