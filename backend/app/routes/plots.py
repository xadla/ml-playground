import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter(prefix="/plots", tags=["plots"])


@router.get("/{filename}")
async def get_plot(filename: str):
    """Serve a generated plot image (PNG)."""
    # Security: only allow .png files
    if not filename.endswith(".png"):
        raise HTTPException(status_code=404, detail="Plot not found")

    # Build full path and prevent directory traversal
    file_path = os.path.normpath(os.path.join(settings.PLOT_DIR, filename))
    if not file_path.startswith(os.path.normpath(settings.PLOT_DIR)):
        raise HTTPException(status_code=404, detail="Plot not found")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Plot not found")

    return FileResponse(file_path, media_type="image/png")
