package com.urbanai;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public class DepartmentRegistry {
    private final Map<Category, String> defaultDepartments;

    private DepartmentRegistry(Map<Category, String> defaultDepartments) {
        this.defaultDepartments = defaultDepartments;
    }

    public static DepartmentRegistry defaultRegistry() {
        Map<Category, String> mapping = new EnumMap<>(Category.class);
        mapping.put(Category.ROADS, "Roads and Public Works");
        mapping.put(Category.SANITATION, "Solid Waste Management");
        mapping.put(Category.WATER, "Water Supply and Sewer Services");
        mapping.put(Category.DRAINAGE, "Stormwater and Drainage");
        mapping.put(Category.LIGHTING, "Electrical Maintenance");
        mapping.put(Category.TRAFFIC, "Traffic Operations");
        mapping.put(Category.GENERAL, "Integrated City Command Center");
        return new DepartmentRegistry(mapping);
    }

    public String resolve(Category category, String area) {
        String base = defaultDepartments.getOrDefault(category, defaultDepartments.get(Category.GENERAL));
        if (area == null || area.isBlank()) {
            return base;
        }
        return base + " - " + area.trim();
    }

    public List<String> listDepartments() {
        return new ArrayList<>(defaultDepartments.values());
    }
}

