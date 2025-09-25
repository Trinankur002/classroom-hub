import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Cropper from "react-easy-crop";

interface AvatarUploadProps {
    isCropOpen: boolean;
    setIsCropOpen: (open: boolean) => void;
    selectedImageDataUrl: string | null;
    setSelectedImageDataUrl: (url: string | null) => void;
    crop: { x: number; y: number };
    setCrop: (crop: { x: number; y: number }) => void;
    zoom: number;
    setZoom: (z: number) => void;
    onCropComplete: (_: any, croppedPixels: any) => void;
    handleConfirmCrop: () => void;
    isUploading: boolean;
    inputFileRef: React.RefObject<HTMLInputElement>;
}

export default function AvatarUpload({
    isCropOpen,
    setIsCropOpen,
    selectedImageDataUrl,
    setSelectedImageDataUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    onCropComplete,
    handleConfirmCrop,
    isUploading,
    inputFileRef,
}: AvatarUploadProps) {
    return (
        <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
            <DialogContent className="max-w-3xl w-full">
                <DialogHeader>
                    <DialogTitle>Crop avatar (square)</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full h-64 sm:h-96 bg-black/5">
                        {selectedImageDataUrl ? (
                            <Cropper
                                image={selectedImageDataUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No image selected</div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <Label className="text-sm">Zoom</Label>
                            <div className="py-2">
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Preview</Label>
                            <div className="w-28 h-28 overflow-hidden rounded bg-muted flex items-center justify-center">
                                {selectedImageDataUrl && (
                                    <img src={selectedImageDataUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Choose a different file</Label>
                            <div className="flex space-x-2">
                                <Button onClick={() => inputFileRef.current?.click()}>Select file</Button>
                                <Button variant="ghost" onClick={() => { setSelectedImageDataUrl(null); setIsCropOpen(false); }}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => { setIsCropOpen(false); setSelectedImageDataUrl(null); }}>Close</Button>
                    <Button onClick={handleConfirmCrop} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Save avatar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
