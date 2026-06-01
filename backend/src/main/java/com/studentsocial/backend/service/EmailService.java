package com.studentsocial.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public void sendPasswordReset(String to, String resetLink) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress.isEmpty() ? "no-reply@learnex.app" : fromAddress);
            helper.setTo(to);
            helper.setSubject("Learnex password reset");
            String html = "<p>Hi,</p>"
                    + "<p>You requested a password reset. Click the link below to reset your password:</p>"
                    + "<p><a href=\"" + resetLink + "\">Reset password</a></p>"
                    + "<p>If you did not request this, ignore this email.</p>";
            helper.setText(html, true);
            mailSender.send(msg);
        } catch (MessagingException ex) {
            throw new RuntimeException("Failed to send email", ex);
        }
    }
    public void sendEmail(String to, String subject, String text) {
    try {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
        helper.setFrom(fromAddress.isEmpty() ? "no-reply@learnex.app" : fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, false);
        mailSender.send(msg);
    } catch (MessagingException ex) {
        throw new RuntimeException("Failed to send email", ex);
    }
}
}
