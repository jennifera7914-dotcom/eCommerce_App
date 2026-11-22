package com.phoneaccessories.backend.service;

import com.phoneaccessories.backend.entity.Address;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.repository.AddressRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;

    private Random random = new Random();

    // OWNER CREATES CUSTOMER - PIN is auto-generated and emailed
    @Transactional
    public User createCustomer(String name, String shopName, String phone, String alternatePhone, String email, String gstNumber, String line1, String line2, String city, String state, String pincode) {
        if (userRepository.existsByPhone(phone)) throw new RuntimeException("Phone already registered");
        if (email != null && !email.isEmpty() && userRepository.existsByEmail(email.toLowerCase())) throw new RuntimeException("Email already registered");

        String pin = String.valueOf(1000 + random.nextInt(9000)); // 4-digit PIN

        User user = new User();
        user.setName(name);
        user.setShopName(shopName);
        user.setPhone(phone);
        user.setAlternatePhone(alternatePhone);
        user.setEmail(email != null ? email.toLowerCase() : null);
        user.setGstNumber(gstNumber);
        user.setPasswordHash(passwordEncoder.encode(pin)); // PIN saved hashed with BCrypt
        user.setIsApproved(true); // Owner created = auto-approved

        User saved = userRepository.save(user);

        Address address = new Address();
        address.setUserId(saved.getId());
        address.setLine1(line1);
        address.setLine2(line2);
        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);
        address.setIsDefault(true);
        addressRepository.save(address);

        emailService.sendPinEmail(saved.getEmail(), name, shopName, pin, phone);
        return saved;
    }

    public List<User> getAllUsers() { return userRepository.findAll(); }
    public Optional<User> getUserById(Long id) { return userRepository.findById(id); }

    @Transactional
    public User updateCustomer(Long id, String name, String shopName, String phone, String alternatePhone, String email, String gstNumber, String line1, String line2, String city, String state, String pincode) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));

        // Duplicate check - exclude this same customer
        userRepository.findByPhone(phone).ifPresent(other -> { if (!other.getId().equals(id)) throw new RuntimeException("Phone already registered"); });
        if (email != null && !email.isEmpty()) {
            userRepository.findByEmail(email.toLowerCase()).ifPresent(other -> { if (!other.getId().equals(id)) throw new RuntimeException("Email already registered"); });
        }

        user.setName(name);
        user.setShopName(shopName);
        user.setPhone(phone);
        user.setAlternatePhone(alternatePhone);
        user.setEmail(email != null ? email.toLowerCase() : null);
        user.setGstNumber(gstNumber);
        // Note: PIN is NOT changed on edit
        User saved = userRepository.save(user);

        List<Address> existing = addressRepository.findByUserId(id);
        Address address = existing.isEmpty() ? new Address() : existing.get(0);
        address.setUserId(id);
        address.setLine1(line1);
        address.setLine2(line2);
        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);
        address.setIsDefault(true);
        addressRepository.save(address);

        return saved;
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) throw new RuntimeException("Customer not found");
        addressRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    // CUSTOMER LOGIN - Phone OR Name + 4-digit PIN
    public Optional<User> loginWithPin(String identifier, String pin) {
        if (identifier == null || pin == null) return Optional.empty();
        String clean = identifier.trim();
        Optional<User> opt = clean.matches("\\d+")
                ? userRepository.findByPhone(clean)
                : userRepository.findFirstByNameIgnoreCase(clean);
        if (opt.isPresent() && passwordEncoder.matches(pin, opt.get().getPasswordHash())) return opt;
        return Optional.empty();
    }
}