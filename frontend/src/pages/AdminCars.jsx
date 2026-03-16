import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader.jsx";
import { fetchCars, addCar, deleteCar, editCar } from "../api/api.js";

const BRANCH_OPTIONS = ["Erfurt", "Berlin", "Frankfurt", "Munich", "Hamburg"];

export default function AdminCars() {
  const [cars, setCars] = useState([]);
  const [editingCarId, setEditingCarId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    production_year: "",
    category: "",
    plate_number: "",
    seats: "",
    transmission: "",
    fuel_type: "",
    daily_price: "",
    status: "available",
    image_url: "",
    description: "",
    available_branches: [],
    technical_specifications: "",
    safety_features: "",
    performance_info: "",
    doors: "",
  });

  const loadCars = async () => {
    try {
      const { data } = await fetchCars();
      setCars(data);
    } catch {
      setError("Failed to load cars");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadCars();
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (success || deleteSuccess || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setDeleteSuccess("");
        setError("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, deleteSuccess, error]);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleBranchChange(branch) {
    setFormData((prev) => {
      const exists = prev.available_branches.includes(branch);

      return {
        ...prev,
        available_branches: exists
          ? prev.available_branches.filter((item) => item !== branch)
          : [...prev.available_branches, branch],
      };
    });
  }

  function handleEdit(car) {
    setFormData({
      brand: car.brand || "",
      model: car.model || "",
      production_year: car.production_year?.toString() || "",
      category: car.category || "",
      plate_number: car.plate_number || "",
      seats: car.seats?.toString() || "",
      transmission: car.transmission || "",
      fuel_type: car.fuel_type || "",
      daily_price: car.daily_price?.toString() || "",
      status: car.status || "available",
      image_url: car.image_url || "",
      description: car.description || "",
      available_branches: car.available_branches
        ? car.available_branches.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      technical_specifications: car.technical_specifications || "",
      safety_features: car.safety_features || "",
      performance_info: car.performance_info || "",
      doors: car.doors?.toString() || "",
    });

    setEditingCarId(car.id);
    setError("");
    setSuccess("");
    setDeleteSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingCarId(null);
    setFormData({
      brand: "",
      model: "",
      production_year: "",
      category: "",
      plate_number: "",
      seats: "",
      transmission: "",
      fuel_type: "",
      daily_price: "",
      status: "available",
      image_url: "",
      description: "",
      available_branches: [],
      technical_specifications: "",
      safety_features: "",
      performance_info: "",
      doors: "",
    });
    setSuccess("");
    setDeleteSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDeleteSuccess("");

    try {
      const payload = {
        ...formData,
        production_year: Number(formData.production_year),
        seats: Number(formData.seats),
        daily_price: Number(formData.daily_price),
        doors: formData.doors ? Number(formData.doors) : null,
        available_branches: formData.available_branches.join(", "),
      };

      if (editingCarId) {
        await editCar(editingCarId, payload);
        setSuccess("Car updated successfully.");
      } else {
        await addCar(payload);
        setSuccess("Car added successfully.");
      }

      handleCancelEdit();
      await loadCars();

      if (editingCarId) {
        setSuccess("Car updated successfully.");
      } else {
        setSuccess("Car added successfully.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save car");
    }
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");
    setDeleteSuccess("");

    try {
      await deleteCar(id);

      if (editingCarId === id) {
        handleCancelEdit();
      }

      await loadCars();
      setDeleteSuccess("Car deleted successfully.");
    } catch {
      setError("Failed to delete car");
    }
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <DashboardHeader title="Cars Management" />

      {error && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-400">
          {success}
        </div>
      )}

      {deleteSuccess && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
          {deleteSuccess}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
          <h2 className="mb-4 text-2xl font-bold">
            {editingCarId ? "Edit Car" : "Add New Car"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <input
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Brand"
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            />

            <input
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Model"
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            />

            <select
              name="production_year"
              value={formData.production_year}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            >
              <option value="">Select Year</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            >
              <option value="">Select Category</option>
              <option value="economy">economy</option>
              <option value="sedan">sedan</option>
              <option value="suv">suv</option>
              <option value="luxury">luxury</option>
              <option value="sports">sports</option>
            </select>

            <input
              name="plate_number"
              value={formData.plate_number}
              onChange={handleChange}
              placeholder="Plate Number"
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            />

            <select
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            >
              <option value="">Select Seats</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>

            <select
              name="doors"
              value={formData.doors}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            >
              <option value="">Select Doors</option>
              <option value="2">2 doors</option>
              <option value="3">3 doors</option>
              <option value="4">4 doors</option>
              <option value="5">5 doors</option>
            </select>

            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            >
              <option value="">Select Transmission</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>

            <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            >
              <option value="">Select Fuel Type</option>
              <option value="petrol">petrol</option>
              <option value="diesel">diesel</option>
              <option value="hybrid">hybrid</option>
              <option value="electric">electric</option>
            </select>

            <input
              name="daily_price"
              value={formData.daily_price}
              onChange={handleChange}
              placeholder="Daily Price"
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
              required
            />

            <input
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="Image URL"
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            />

            <div className="rounded-xl border border-gray-700 bg-[#181818] p-4">
              <p className="mb-3 font-semibold text-white">Available Branches</p>
              <div className="grid grid-cols-2 gap-3">
                {BRANCH_OPTIONS.map((branch) => (
                  <label key={branch} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.available_branches.includes(branch)}
                      onChange={() => handleBranchChange(branch)}
                    />
                    {branch}
                  </label>
                ))}
              </div>
            </div>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Car Description"
              rows={4}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            />

            <textarea
              name="technical_specifications"
              value={formData.technical_specifications}
              onChange={handleChange}
              placeholder="Technical Specifications"
              rows={4}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            />

            <textarea
              name="safety_features"
              value={formData.safety_features}
              onChange={handleChange}
              placeholder="Safety Features"
              rows={4}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            />

            <textarea
              name="performance_info"
              value={formData.performance_info}
              onChange={handleChange}
              placeholder="Performance Info"
              rows={4}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="rounded-lg bg-[#222] p-3 text-white outline-none"
            >
              <option value="available">available</option>
              <option value="booked">booked</option>
              <option value="maintenance">maintenance</option>
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[#ff5f00] py-3 font-bold text-white hover:bg-[#e55500]"
              >
                {editingCarId ? "Update Car" : "Add Car"}
              </button>

              {editingCarId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-gray-700 px-4 py-3 font-semibold text-white hover:border-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6">
          <h2 className="mb-4 text-2xl font-bold">All Cars</h2>

          <div className="space-y-4">
            {cars.map((car) => (
              <div
                key={car.id}
                className="rounded-xl border border-gray-800 bg-black p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      {car.brand} {car.model}
                    </h3>

                    <p className="text-sm text-gray-400">
                      {car.production_year} • {car.plate_number}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {car.category} • {car.transmission} • {car.fuel_type} • {car.seats} seats • {car.doors || "N/A"} doors
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Status: {car.status}
                    </p>

                    {car.available_branches && (
                      <p className="mt-1 text-sm text-gray-400">
                        Branches: {car.available_branches}
                      </p>
                    )}

                    {car.description && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {car.description}
                      </p>
                    )}

                    <p className="mt-1 font-bold text-[#ff5f00]">
                      €{car.daily_price} / day
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(car)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(car.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {car.image_url && (
                  <img
                    src={car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    className="mt-4 h-40 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}