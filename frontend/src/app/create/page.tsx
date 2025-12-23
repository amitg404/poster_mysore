"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import axios from "axios";
import { Loader2, Upload, X, ShoppingCart, Crop as CropIcon, Check, CheckCircle, Image as ImageIcon } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { PosterPreview } from "@/components/PosterPreview";
import Link from "next/link";
import NextImage from "next/image";

// Define locally to avoid import issues
type Point = { x: number; y: number };

// --- Canvas Helper Functions ---
// (Removed duplicates: Area, createImage, getCroppedImg are imported)

export default function CreatePage() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Set mounted true on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const [imageSrc, setImageSrc] = useState<string | null>(null); // Original Image
  
  // Cropper State
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  // Final Result State
  const [preview, setPreview] = useState<string | null>(null); // Cropped Preview URL
  const [blobForUpload, setBlobForUpload] = useState<Blob | null>(null);
  
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
             const result = reader.result as string;
             setImageSrc(result);
             
             // Check Resolution
             const img = document.createElement('img');
             img.onload = () => {
                 if (img.width < 1000 || img.height < 1000) {
                     toast.warning("Low Resolution Image", {
                         description: "This image might look blurry when printed. recommended size: > 1000px",
                         duration: 5000,
                     });
                     setError("Warning: Low resolution image. It may look blurry when printed.");
                 } else {
                     setError("");
                 }
                 setIsCropping(true);
             };
             img.src = result;
        });
        reader.readAsDataURL(selectedFile);
        
        // Reset everything else
        setPreview(null);
        setUploadedUrl(null);
        setBlobForUpload(null);
        setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (blob) {
          setBlobForUpload(blob);
          setPreview(URL.createObjectURL(blob));
          setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to crop image.");
    }
  }, [imageSrc, croppedAreaPixels]);

  const handleUpload = async () => {
    if (!blobForUpload) return;
    
    setUploading(true);
    setError("");

    const formData = new FormData();
    // Rename file to indicate custom crop
    formData.append("image", blobForUpload, "custom_poster_crop.jpg");

    try {
        const res = await axios.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setUploadedUrl(res.data.url);
        toast.success("Design Ready!");
    } catch (err) {
        console.error(err);
        setError("Failed to upload image. Please try again.");
    } finally {
        setUploading(false);
    }
  };

  const removeFile = () => {
    setImageSrc(null);
    setPreview(null);
    setBlobForUpload(null);
    setUploadedUrl(null);
    setIsCropping(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">



      {/* Navbar Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110">
                {mounted && (
                     <>
                        <NextImage src="/assets/logo_dark.png" alt="Logo" fill className="object-contain dark:hidden" sizes="40px" priority />
                        <NextImage src="/assets/Logo_light.png" alt="Logo" fill className="object-contain hidden dark:block" sizes="40px" priority />
                     </>
                 )}
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                PosterShop
            </span>
          </Link>
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <Link href="/cart" className="p-2 hover:bg-white/5 rounded-full relative group z-50">
                <ShoppingCart className="w-6 h-6 group-hover:text-primary transition-colors" />
                {mounted && items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce" suppressHydrationWarning>
                        {items.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                )}
             </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-24 flex flex-col md:flex-row gap-8 items-start justify-center">
        
        {/* Upload & Crop Section */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-1/3 bg-card border border-border p-6 rounded-2xl shadow-xl space-y-6"
        >
            <div>
                 <h1 className="text-2xl font-bold mb-2">Create Your Own</h1>
                 <p className="text-muted-foreground text-sm">Upload, crop, and frame your masterpiece.</p>
            </div>
            
            {!imageSrc ? (
                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors h-64 ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/50 hover:bg-white/5'}`}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-center font-medium">Drag & drop an image here</p>
                    <p className="text-xs text-muted-foreground mt-2">or click to select file</p>
                </div>
            ) : isCropping ? (
                <div className="relative rounded-xl overflow-hidden border border-border h-[400px] bg-black">
                     <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={297 / 420} // A3 Aspect Ratio
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                     />
                     <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10 px-4">
                        <button 
                             onClick={() => {
                                 if (preview) {
                                     setIsCropping(false);
                                 } else {
                                     removeFile();
                                 }
                             }}
                             className="px-4 py-2 bg-black/70 text-white rounded-full text-sm hover:bg-black/90"
                        >
                            Cancel
                        </button>
                        <button 
                             onClick={showCroppedImage}
                             className="px-6 py-2 bg-primary text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
                        >
                            Done
                        </button>
                     </div>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-border group bg-neutral-900">
                    {/* Advanced Preview Component */}
                    <PosterPreview imageSrc={preview!} />

                    <div className="absolute top-4 right-4 z-50 flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-colors border border-red-500/50"
                            title="Remove"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsCropping(true)}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                            title="Edit / Crop"
                        >
                            <CropIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {!uploadedUrl && (
                        <div className="mt-4 flex flex-col items-center gap-3">
                             <p className="text-sm text-gray-400">Happy with the look?</p>
                             <button 
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-8 py-3 bg-primary hover:bg-green-400 text-black font-bold rounded-full text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center gap-2"
                             >
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Confirm & Add to Cart
                             </button>
                        </div>
                    )}
                </div>
            )}

            
            {error && <p className="text-orange-400 text-sm mt-4 bg-orange-500/10 p-2 rounded border border-orange-500/20 text-center">{error}</p>}
            
            {uploadedUrl && (
                 <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Ready to Print!</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Your image has been optimized for A3 printing.</p>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            const { addToCart, triggerAnimation } = useCartStore.getState();
                            
                            // Get preview image element for animation source
                            const img = document.querySelector('img[alt="Mockup"]') as HTMLImageElement;
                            if (img) {
                                // Calculate center of the image
                                const rect = img.getBoundingClientRect();
                                triggerAnimation(rect.left + rect.width / 2, rect.top + rect.height / 2, uploadedUrl);
                            }



                            addToCart({
                                id: 'custom-poster-base', // Must match backend Product ID
                                title: 'Custom Poster (Your Design)',
                                price: 199,
                                images: [uploadedUrl],
                                category: 'Custom',
                                customImage: uploadedUrl
                            });
                            toast.success("Added Custom Poster to Cart!");
                        }}
                        className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex flex-col items-center justify-center p-2"
                    >
                         <span className="text-sm">Add Custom Poster to Cart</span>
                         <div className="flex items-center gap-2 text-base">
                             <span className="line-through text-gray-400 text-xs text-muted">₹399</span>
                             <span>₹199</span>
                         </div>
                    </button>
                 </div>
            )}
        </motion.div>

        {/* Mockup Preview */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
            className="w-full md:w-1/2 min-h-[500px] bg-neutral-900 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center p-12 shadow-2xl"
        >
             {/* Realistic Wall Background */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
             
             {/* Poster Frame */}
             <div className="relative z-10 bg-white p-2 shadow-2xl rotate-1 max-w-sm w-full mx-auto" style={{ aspectRatio: '1/1.414' }}>
                <div className="w-full h-full bg-neutral-200 overflow-hidden relative border border-gray-100 flex items-center justify-center">
                    {preview || isCropping ? (
                        <NextImage 
                            src={preview || imageSrc || ""} 
                            alt="Mockup" 
                            fill
                            className="object-cover" 
                            style={isCropping ? { opacity: 0.5, filter: 'blur(2px)' } : {}}
                            unoptimized
                        />
                    ) : (
                        <div className="text-center p-8">
                             <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                             <p className="text-gray-400 text-sm">Your Art Here</p>
                        </div>
                    )}
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
             </div>
             
             {isCropping && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <p className="text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">Adjusting Crop...</p>
                 </div>
             )}
        </motion.div>

      </main>
    </div>
  );
}
